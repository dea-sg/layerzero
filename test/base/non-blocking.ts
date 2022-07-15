/* eslint-disable new-cap */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect, use } from 'chai'
import { ethers } from 'hardhat'
import { solidity } from 'ethereum-waffle'
import {
	deploy,
	makeSnapshot,
	resetChain,
	makeRoleErrorMessage,
} from '../utils'
import {
	TestUtils,
	TestNonblockingUpgradeable,
	TestInterfaceId,
} from '../../typechain-types'

use(solidity)

describe('Nonblocking', () => {
	let nonblocking: TestNonblockingUpgradeable
	let interfaceId: TestInterfaceId
	let utils: TestUtils
	let snapshot: string

	before(async () => {
		nonblocking = await deploy<TestNonblockingUpgradeable>(
			'TestNonblockingUpgradeable'
		)
		await nonblocking.initialize(ethers.constants.AddressZero)
		utils = await deploy<TestUtils>('TestUtils')
		interfaceId = await deploy<TestInterfaceId>('TestInterfaceId')
	})
	beforeEach(async () => {
		snapshot = await makeSnapshot()
	})
	afterEach(async () => {
		await resetChain(snapshot)
	})

	describe('retryMessage', () => {
		describe('success', () => {
			it('execute retry', async () => {
				await nonblocking.setFailedMessage(
					1,
					'0x1234',
					2,
					ethers.utils.keccak256('0x9999')
				)
				await expect(nonblocking.retryMessage(1, '0x1234', 2, '0x9999'))
					.to.emit(nonblocking, 'Executed')
					.withArgs(1, '0x1234', 2, '0x9999')
				const message = await nonblocking.getFailedMessage(1, '0x1234', 2)
				expect(message).to.be.equal(ethers.constants.HashZero)
			})
		})
		describe('fail', () => {
			it('failed message is not set', async () => {
				await expect(
					nonblocking.retryMessage(1, '0x1234', 2, '0x4321')
				).to.be.revertedWith('LzReceiver: no stored message')
			})
			it('different message hash', async () => {
				await nonblocking.setFailedMessage(
					1,
					'0x1234',
					2,
					ethers.utils.keccak256('0x9999')
				)
				await expect(
					nonblocking.retryMessage(1, '0x1234', 2, '0x4321')
				).to.be.revertedWith('LzReceiver: invalid payload')
			})
			it('only executed from admin role', async () => {
				const [, other] = await ethers.getSigners()
				const errorMessage = await makeRoleErrorMessage(
					utils,
					other.address,
					await nonblocking.DEFAULT_ADMIN_ROLE()
				)
				await expect(
					nonblocking.connect(other).retryMessage(1, '0x1234', 2, '0x4321')
				).to.be.revertedWith(errorMessage)
			})
		})
	})

	describe('supportsInterface', () => {
		describe('success', () => {
			it('ILayerZeroBase', async () => {
				const id = await interfaceId.getLayerZeroBaseId()
				const result = await nonblocking.supportsInterface(id)
				expect(result).to.be.true
			})
			it('INonblocking', async () => {
				const id = await interfaceId.getNonblockingId()
				const result = await nonblocking.supportsInterface(id)
				expect(result).to.be.true
			})
		})
		describe('fail', () => {
			it('unsupported interface', async () => {
				const result = await nonblocking.supportsInterface('0x11223344')
				expect(result).to.be.false
			})
		})
	})

	describe('nonblockingLzReceive', () => {
		describe('fail', () => {
			it('private method', async () => {
				await expect(
					nonblocking.nonblockingLzReceive(1, '0x1234', 2, '0x4321')
				).to.be.revertedWith('LzReceiver: caller must be Bridge')
			})
		})
	})
	describe('blockingLzReceive', () => {
		describe('success', () => {
			it('save error message(revert)', async () => {
				await nonblocking.changeStatus(1)
				await expect(nonblocking.blockingLzReceive(1, '0x1234', 2, '0x9999'))
					.to.emit(nonblocking, 'MessageFailed')
					.withArgs(1, '0x1234', 2, '0x9999', 'error!!!!')
				const message = await nonblocking.getFailedMessage(1, '0x1234', 2)
				expect(message).to.be.equal(ethers.utils.keccak256('0x9999'))
			})
			it('save error message(other)', async () => {
				await nonblocking.changeStatus(2)
				await expect(nonblocking.blockingLzReceive(1, '0x1234', 2, '0x9999'))
					.to.emit(nonblocking, 'MessageFailed')
					.withArgs(1, '0x1234', 2, '0x9999', '')
				const message = await nonblocking.getFailedMessage(1, '0x1234', 2)
				expect(message).to.be.equal(ethers.utils.keccak256('0x9999'))
			})
		})
	})
})

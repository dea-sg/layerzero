/* eslint-disable new-cap */
import { expect, use } from 'chai'
import { ethers } from 'hardhat'
import { solidity } from 'ethereum-waffle'
import {
	deploy,
	makeSnapshot,
	resetChain,
	makeRoleErrorMessage,
} from '../utils'
import { TestUtils, TestNonblockingUpgradeable } from '../../typechain-types'

use(solidity)

describe('Nonblocking', () => {
	let token: TestNonblockingUpgradeable
	let utils: TestUtils
	let snapshot: string

	before(async () => {
		token = await deploy<TestNonblockingUpgradeable>(
			'TestNonblockingUpgradeable'
		)
		await token.initialize(ethers.constants.AddressZero)
		utils = await deploy<TestUtils>('TestUtils')
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
				await token.setFailedMessage(
					1,
					'0x1234',
					2,
					ethers.utils.keccak256('0x9999')
				)
				await expect(token.retryMessage(1, '0x1234', 2, '0x9999'))
					.to.emit(token, 'Executed')
					.withArgs(1, '0x1234', 2, '0x9999')
				const message = await token.getFailedMessage(1, '0x1234', 2)
				expect(message).to.be.equal(ethers.constants.HashZero)
			})
		})
		describe('fail', () => {
			it('failed message is not set', async () => {
				await expect(
					token.retryMessage(1, '0x1234', 2, '0x4321')
				).to.be.revertedWith('LzReceiver: no stored message')
			})
			it('different message hash', async () => {
				await token.setFailedMessage(
					1,
					'0x1234',
					2,
					ethers.utils.keccak256('0x9999')
				)
				await expect(
					token.retryMessage(1, '0x1234', 2, '0x4321')
				).to.be.revertedWith('LzReceiver: invalid payload')
			})
			it('only executed from admin role', async () => {
				const [, other] = await ethers.getSigners()
				const errorMessage = await makeRoleErrorMessage(
					utils,
					other.address,
					await token.DEFAULT_ADMIN_ROLE()
				)
				await expect(
					token.connect(other).retryMessage(1, '0x1234', 2, '0x4321')
				).to.be.revertedWith(errorMessage)
			})
		})
	})
	describe('nonblockingLzReceive', () => {
		describe('fail', () => {
			it('private method', async () => {
				await expect(
					token.nonblockingLzReceive(1, '0x1234', 2, '0x4321')
				).to.be.revertedWith('LzReceiver: caller must be Bridge')
			})
		})
	})
	describe('blockingLzReceive', () => {
		describe('success', () => {
			it('save error message(revert)', async () => {
				await token.changeStatus(1)
				await expect(token.blockingLzReceive(1, '0x1234', 2, '0x9999'))
					.to.emit(token, 'MessageFailed')
					.withArgs(1, '0x1234', 2, '0x9999', 'error!!!!')
				const message = await token.getFailedMessage(1, '0x1234', 2)
				expect(message).to.be.equal(ethers.utils.keccak256('0x9999'))
			})
			it('save error message(other)', async () => {
				await token.changeStatus(2)
				await expect(token.blockingLzReceive(1, '0x1234', 2, '0x9999'))
					.to.emit(token, 'MessageFailed')
					.withArgs(1, '0x1234', 2, '0x9999', '')
				const message = await token.getFailedMessage(1, '0x1234', 2)
				expect(message).to.be.equal(ethers.utils.keccak256('0x9999'))
			})
		})
	})
})

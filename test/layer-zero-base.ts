/* eslint-disable new-cap */

/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect, use } from 'chai'
import { ethers, waffle } from 'hardhat'
import { solidity, MockContract } from 'ethereum-waffle'
import { deploy, makeSnapshot, resetChain, makeRoleErrorMessage } from './utils'
import {
	TestLayerZeroBaseUpgradeable,
	TestUtils,
	TestEndPoint,
} from '../typechain-types'
import { abi as LayerZeroEndpoint } from '../artifacts/contracts/interfaces/ILayerZeroEndpoint.sol/ILayerZeroEndpoint.json'
const { deployMockContract } = waffle

use(solidity)

describe('LayerZeroBaseUpgradeable', () => {
	let lzBase1: TestLayerZeroBaseUpgradeable
	let lzBase2: TestLayerZeroBaseUpgradeable
	let utils: TestUtils
	let snapshot: string
	let mockEndPoint: MockContract

	before(async () => {
		lzBase1 = await deploy<TestLayerZeroBaseUpgradeable>(
			'TestLayerZeroBaseUpgradeable'
		)
		lzBase2 = await deploy<TestLayerZeroBaseUpgradeable>(
			'TestLayerZeroBaseUpgradeable'
		)
		utils = await deploy<TestUtils>('TestUtils')
		const [deployer] = await ethers.getSigners()
		mockEndPoint = await deployMockContract(deployer, LayerZeroEndpoint)
		await lzBase1.initialize(mockEndPoint.address)
		await lzBase2.initialize(mockEndPoint.address)
	})
	beforeEach(async () => {
		snapshot = await makeSnapshot()
	})
	afterEach(async () => {
		await resetChain(snapshot)
	})

	describe('lzSend', () => {
		describe('success', () => {
			it('send message(use zero)', async () => {
				const empty = ethers.Wallet.createRandom()
				const payment = ethers.Wallet.createRandom()
				const [deployer] = await ethers.getSigners()
				await lzBase1.setTrustedRemote(1, deployer.address)
				await mockEndPoint.mock.estimateFees
					.withArgs(1, lzBase1.address, '0x', false, '0x')
					.returns(100, 10)
				await mockEndPoint.mock.send
					.withArgs(
						1,
						deployer.address,
						'0x',
						empty.address,
						payment.address,
						'0x'
					)
					.returns()
				await lzBase1.lzSend(1, '0x', empty.address, payment.address, '0x', {
					value: ethers.utils.parseUnits('100', 'wei'),
				})
				expect(true).to.be.true
			})
		})
		describe('fail', () => {
			it('not trusted chain', async () => {
				const empty = ethers.Wallet.createRandom()
				const payment = ethers.Wallet.createRandom()
				await expect(
					lzBase1.lzSend(1, '0x', empty.address, payment.address, '0x')
				).to.be.revertedWith(
					'LzSend: destination chain is not a trusted source'
				)
			})
			it('Not enough additional gas', async () => {
				const empty = ethers.Wallet.createRandom()
				const payment = ethers.Wallet.createRandom()
				const [deployer] = await ethers.getSigners()
				await lzBase1.setTrustedRemote(1, deployer.address)
				await mockEndPoint.mock.estimateFees
					.withArgs(1, lzBase1.address, '0x', false, '0x')
					.returns(100, 10)
				await expect(
					lzBase1.lzSend(1, '0x', empty.address, payment.address, '0x', {
						value: ethers.utils.parseUnits('1', 'wei'),
					})
				).to.be.revertedWith('Must send enough value to cover messageFee')
			})
		})
	})

	describe('getLzEndpoint', () => {
		it('get endpoint address', async () => {
			const endPoint = await lzBase1.getLzEndpoint()
			expect(endPoint).to.be.equal(mockEndPoint.address)
		})
	})

	describe('getTrustedRemote', () => {
		it('get trusted address', async () => {
			await lzBase1.setTrustedRemote(1, lzBase2.address)
			const address = await lzBase1.getTrustedRemote(1)
			expect(address.toLowerCase()).to.be.equal(lzBase2.address.toLowerCase())
		})
		it('If trusted address is not registered', async () => {
			await lzBase1.setTrustedRemote(1, lzBase2.address)
			const address = await lzBase1.getTrustedRemote(2)
			expect(address).to.be.equal('0x')
		})
	})

	describe('isTrustedRemote', () => {
		it('check trusted address', async () => {
			await lzBase1.setTrustedRemote(1, lzBase2.address)
			const result = await lzBase1.isTrustedRemote(1, lzBase2.address)
			expect(result).to.be.equal(true)
		})
		it('check not trusted address', async () => {
			await lzBase1.setTrustedRemote(1, lzBase2.address)
			const [, other] = await ethers.getSigners()
			const result = await lzBase1.isTrustedRemote(1, other.address)
			expect(result).to.be.equal(false)
		})
	})
	describe('setTrustedRemote', () => {
		describe('success', () => {
			it('generate event', async () => {
				await lzBase1.setTrustedRemote(1, lzBase2.address)
				const filter = lzBase1.filters.SetTrustedRemote()
				const events = await lzBase1.queryFilter(filter)
				expect(events[0].args._srcChainId).to.be.equal(1)
				expect(events[0].args._srcAddress.toLowerCase()).to.be.equal(
					lzBase2.address.toLowerCase()
				)
			})
		})
		describe('fail', () => {
			it('only admin', async () => {
				const [, other] = await ethers.getSigners()
				const otherLzBase1 = lzBase1.connect(other)
				const errorMessage = await makeRoleErrorMessage(
					utils,
					other.address,
					await lzBase1.DEFAULT_ADMIN_ROLE()
				)
				await expect(
					otherLzBase1.setTrustedRemote(1, lzBase2.address)
				).to.be.revertedWith(errorMessage)
			})
		})
	})
	describe('forceResumeReceive', () => {
		describe('success', () => {
			it('execute forceResumeReceive', async () => {
				const [, other] = await ethers.getSigners()
				await mockEndPoint.mock.forceResumeReceive
					.withArgs(1, other.address)
					.revertsWithReason('executed!')
				await expect(
					lzBase1.forceResumeReceive(1, other.address)
				).to.be.revertedWith('executed!')
			})
		})
		describe('fail', () => {
			it('only admin', async () => {
				const [, other] = await ethers.getSigners()
				const errorMessage = await makeRoleErrorMessage(
					utils,
					other.address,
					await lzBase1.DEFAULT_ADMIN_ROLE()
				)
				await expect(
					lzBase1.connect(other).forceResumeReceive(1, other.address)
				).to.be.revertedWith(errorMessage)
			})
		})
	})
	describe('setReceiveVersion', () => {
		describe('success', () => {
			it('execute setReceiveVersion', async () => {
				await mockEndPoint.mock.setReceiveVersion
					.withArgs(1)
					.revertsWithReason('executed!')
				await expect(lzBase1.setReceiveVersion(1)).to.be.revertedWith(
					'executed!'
				)
			})
		})
		describe('fail', () => {
			it('only admin', async () => {
				const [, other] = await ethers.getSigners()
				const errorMessage = await makeRoleErrorMessage(
					utils,
					other.address,
					await lzBase1.DEFAULT_ADMIN_ROLE()
				)
				await expect(
					lzBase1.connect(other).setReceiveVersion(1)
				).to.be.revertedWith(errorMessage)
			})
		})
	})

	describe('setSendVersion', () => {
		describe('success', () => {
			it('execute setSendVersion', async () => {
				await mockEndPoint.mock.setSendVersion
					.withArgs(1)
					.revertsWithReason('executed!')
				await expect(lzBase1.setSendVersion(1)).to.be.revertedWith('executed!')
			})
		})
		describe('fail', () => {
			it('only admin', async () => {
				const [, other] = await ethers.getSigners()
				const errorMessage = await makeRoleErrorMessage(
					utils,
					other.address,
					await lzBase1.DEFAULT_ADMIN_ROLE()
				)
				await expect(
					lzBase1.connect(other).setSendVersion(1)
				).to.be.revertedWith(errorMessage)
			})
		})
	})

	describe('setConfig', () => {
		describe('success', () => {
			it('execute setConfig', async () => {
				await mockEndPoint.mock.setConfig
					.withArgs(1, 2, 3, '0x')
					.revertsWithReason('executed!')
				await expect(lzBase1.setConfig(1, 2, 3, '0x')).to.be.revertedWith(
					'executed!'
				)
			})
		})
		describe('fail', () => {
			it('only admin', async () => {
				const [, other] = await ethers.getSigners()
				const errorMessage = await makeRoleErrorMessage(
					utils,
					other.address,
					await lzBase1.DEFAULT_ADMIN_ROLE()
				)
				await expect(
					lzBase1.connect(other).setConfig(1, 2, 3, '0x')
				).to.be.revertedWith(errorMessage)
			})
		})
	})
	describe('getConfig', () => {
		it('execute setConfig', async () => {
			await mockEndPoint.mock.getSendVersion
				.withArgs(lzBase1.address)
				.returns(1)
			await mockEndPoint.mock.getConfig
				.withArgs(1, 2, lzBase1.address, 3)
				.returns('0x1234')
			const config = await lzBase1.getConfig(
				0,
				2,
				ethers.constants.AddressZero,
				3
			)
			expect(config).to.be.equal('0x1234')
		})
	})
})

describe('lzReceive', () => {
	describe('success', () => {
		it('execute _blockingLzReceive', async () => {
			const lsBase = await deploy<TestLayerZeroBaseUpgradeable>(
				'TestLayerZeroBaseUpgradeable'
			)
			const endPoint = await deploy<TestEndPoint>('TestEndPoint')
			await lsBase.initialize(endPoint.address)
			await endPoint.setLzBase(lsBase.address)
			await lsBase.setTrustedRemote(1, '0x4321')
			await expect(endPoint.executeLsReceive(1, '0x4321', 2, '0x1234'))
				.to.emit(lsBase, 'Executed')
				.withArgs(1, '0x4321', 2, '0x1234')
		})
	})
	describe('fail', () => {
		it('only executed from endpoint', async () => {
			const lsBase = await deploy<TestLayerZeroBaseUpgradeable>(
				'TestLayerZeroBaseUpgradeable'
			)
			await expect(lsBase.lzReceive(1, '0x', 2, '0x1234')).to.be.revertedWith(
				'LzReceiver: illegal access'
			)
		})
		it('Execution from an invalid address', async () => {
			const lsBase = await deploy<TestLayerZeroBaseUpgradeable>(
				'TestLayerZeroBaseUpgradeable'
			)
			const endPoint = await deploy<TestEndPoint>('TestEndPoint')
			await lsBase.initialize(endPoint.address)
			await endPoint.setLzBase(lsBase.address)
			await expect(
				endPoint.executeLsReceive(1, '0x', 2, '0x1234')
			).to.be.revertedWith('LzReceiver: illegal address')
		})
		it('Execution from an not trusted address', async () => {
			const lsBase = await deploy<TestLayerZeroBaseUpgradeable>(
				'TestLayerZeroBaseUpgradeable'
			)
			const endPoint = await deploy<TestEndPoint>('TestEndPoint')
			await lsBase.initialize(endPoint.address)
			await endPoint.setLzBase(lsBase.address)
			await expect(
				endPoint.executeLsReceive(1, '0x4321', 2, '0x1234')
			).to.be.revertedWith('LzReceiver: invalid source sending contract')
		})
	})
})

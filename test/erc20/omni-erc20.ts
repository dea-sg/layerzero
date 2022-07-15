/* eslint-disable @typescript-eslint/no-unused-expressions */

import { expect, use } from 'chai'
import { ethers, waffle } from 'hardhat'
import { solidity, MockContract } from 'ethereum-waffle'
import { deploy, makeSnapshot, resetChain } from '../utils'
import {
	TestOmniERC20Upgradeable,
	TestInterfaceId,
} from '../../typechain-types'
import { abi as LayerZeroEndpoint } from '../../artifacts/contracts/interfaces/ILayerZeroEndpoint.sol/ILayerZeroEndpoint.json'
const { deployMockContract } = waffle

use(solidity)

describe('OmniERC20', () => {
	let token: TestOmniERC20Upgradeable
	let interfaceId: TestInterfaceId
	let mockEndPoint: MockContract
	let snapshot: string

	before(async () => {
		const [deployer] = await ethers.getSigners()
		mockEndPoint = await deployMockContract(deployer, LayerZeroEndpoint)
		token = await deploy<TestOmniERC20Upgradeable>('TestOmniERC20Upgradeable')
		await token.initialize('token', 'TOKEN', mockEndPoint.address)
		interfaceId = await deploy<TestInterfaceId>('TestInterfaceId')
	})
	beforeEach(async () => {
		snapshot = await makeSnapshot()
	})
	afterEach(async () => {
		await resetChain(snapshot)
	})

	describe('supportsInterface', () => {
		describe('success', () => {
			it('ILayerZeroBase', async () => {
				const id = await interfaceId.getLayerZeroBaseId()
				const result = await token.supportsInterface(id)
				expect(result).to.be.true
			})
			it('IOmniERC20', async () => {
				const id = await interfaceId.getOmniERC20Id()
				const result = await token.supportsInterface(id)
				expect(result).to.be.true
			})
			it('IERC20Upgradeable', async () => {
				const id = await interfaceId.getERC20UpgradeableId()
				const result = await token.supportsInterface(id)
				expect(result).to.be.true
			})
			it('IERC20MetadataUpgradeable', async () => {
				const id = await interfaceId.getERC20MetadataUpgradeableId()
				const result = await token.supportsInterface(id)
				expect(result).to.be.true
			})
		})
		describe('fail', () => {
			it('unsupported interface', async () => {
				const result = await token.supportsInterface('0x11223344')
				expect(result).to.be.false
			})
		})
	})

	describe('estimateSendFee', () => {
		it('get gas fee', async () => {
			const [, other] = await ethers.getSigners()
			const coder = new ethers.utils.AbiCoder()
			const payload = coder.encode(['bytes', 'uint256'], [other.address, 100])
			await mockEndPoint.mock.estimateFees
				.withArgs(1, token.address, payload, false, '0x')
				.returns(5, 6)
			const result = await token.estimateSendFee(
				1,
				other.address,
				100,
				false,
				'0x'
			)
			expect(result[0].toString()).to.be.equal('5')
			expect(result[1].toString()).to.be.equal('6')
		})
	})

	describe('nonblockingLzReceive', () => {
		it('token is minted', async () => {
			const empty1 = ethers.Wallet.createRandom()
			const coder = new ethers.utils.AbiCoder()
			const payload = coder.encode(['bytes', 'uint256'], [empty1.address, 100])
			const beforeBalance = await token.balanceOf(empty1.address)
			expect(beforeBalance.toString()).to.be.equal('0')
			await token.executeNonblockingLzReceive(1, empty1.address, 23, payload)
			const afterBalance = await token.balanceOf(empty1.address)
			expect(afterBalance.toString()).to.be.equal('100')
		})
		it('generated event', async () => {
			const empty1 = ethers.Wallet.createRandom()
			const coder = new ethers.utils.AbiCoder()
			const payload = coder.encode(['bytes', 'uint256'], [empty1.address, 100])
			await expect(
				token.executeNonblockingLzReceive(1, empty1.address, 23, payload)
			)
				.to.emit(token, 'ReceiveFromChain')
				.withArgs(1, empty1.address, 100, 23)
		})
	})

	describe('sendFrom(mine)', () => {
		describe('success', () => {
			it('burned token', async () => {
				const empty1 = ethers.Wallet.createRandom()
				const zeroToken = ethers.Wallet.createRandom()
				const dstWallet = ethers.Wallet.createRandom()
				const dstContract = ethers.Wallet.createRandom()
				const [deployer] = await ethers.getSigners()
				const coder = new ethers.utils.AbiCoder()
				const payload = coder.encode(
					['bytes', 'uint256'],
					[dstWallet.address, 50]
				)

				await mockEndPoint.mock.estimateFees
					.withArgs(1, token.address, payload, false, '0x1234')
					.returns(10, 20)
				await mockEndPoint.mock.send
					.withArgs(
						1,
						dstContract.address,
						payload,
						empty1.address,
						zeroToken.address,
						'0x1234'
					)
					.returns()
				await mockEndPoint.mock.getOutboundNonce
					.withArgs(1, token.address)
					.returns(98)

				await token.mint(deployer.address, 100)
				const beforeBalance = await token.balanceOf(deployer.address)
				expect(beforeBalance.toString()).to.be.equal('100')

				await token.setTrustedRemote(1, dstContract.address)
				await token.sendFrom(
					deployer.address,
					1,
					dstWallet.address,
					50,
					empty1.address,
					zeroToken.address,
					'0x1234',
					{
						value: ethers.utils.parseUnits('100', 'wei'),
					}
				)
				const afterBalance = await token.balanceOf(deployer.address)
				expect(afterBalance.toString()).to.be.equal('50')
			})
			it('generate event', async () => {
				const empty1 = ethers.Wallet.createRandom()
				const zeroToken = ethers.Wallet.createRandom()
				const dstWallet = ethers.Wallet.createRandom()
				const dstContract = ethers.Wallet.createRandom()
				const [deployer] = await ethers.getSigners()
				const coder = new ethers.utils.AbiCoder()
				const payload = coder.encode(
					['bytes', 'uint256'],
					[dstWallet.address, 50]
				)

				await mockEndPoint.mock.estimateFees
					.withArgs(1, token.address, payload, false, '0x1234')
					.returns(10, 20)

				await mockEndPoint.mock.send
					.withArgs(
						1,
						dstContract.address,
						payload,
						empty1.address,
						zeroToken.address,
						'0x1234'
					)
					.returns()
				await mockEndPoint.mock.getOutboundNonce
					.withArgs(1, token.address)
					.returns(98)

				await token.mint(deployer.address, 100)
				await token.setTrustedRemote(1, dstContract.address)
				await expect(
					token.sendFrom(
						deployer.address,
						1,
						dstWallet.address,
						50,
						empty1.address,
						zeroToken.address,
						'0x1234',
						{
							value: ethers.utils.parseUnits('100', 'wei'),
						}
					)
				)
					.to.emit(token, 'SendToChain')
					.withArgs(deployer.address, 1, dstWallet.address, 50, 98)
			})
		})
		describe('fail', () => {
			it('do not have token.', async () => {
				const empty1 = ethers.Wallet.createRandom()
				const empty2 = ethers.Wallet.createRandom()
				const empty3 = ethers.Wallet.createRandom()
				const [deployer] = await ethers.getSigners()

				await expect(
					token.sendFrom(
						deployer.address,
						1,
						empty1.address,
						2,
						empty2.address,
						empty3.address,
						'0x'
					)
				).to.be.revertedWith('ERC20: burn amount exceeds balance')
			})
			it('trusted address is not set.', async () => {
				const empty1 = ethers.Wallet.createRandom()
				const empty2 = ethers.Wallet.createRandom()
				const empty3 = ethers.Wallet.createRandom()
				const [deployer] = await ethers.getSigners()

				await token.mint(deployer.address, 100)
				await expect(
					token.sendFrom(
						deployer.address,
						1,
						empty1.address,
						2,
						empty2.address,
						empty3.address,
						'0x'
					)
				).to.be.revertedWith(
					'LzSend: destination chain is not a trusted source'
				)
			})
		})
	})

	describe('sendFrom(other)', () => {
		describe('success', () => {
			it('burned token', async () => {
				const empty1 = ethers.Wallet.createRandom()
				const zeroToken = ethers.Wallet.createRandom()
				const dstWallet = ethers.Wallet.createRandom()
				const dstContract = ethers.Wallet.createRandom()
				const [deployer, other] = await ethers.getSigners()
				const coder = new ethers.utils.AbiCoder()
				const payload = coder.encode(
					['bytes', 'uint256'],
					[dstWallet.address, 50]
				)
				await mockEndPoint.mock.estimateFees
					.withArgs(1, token.address, payload, false, '0x1234')
					.returns(10, 20)
				await mockEndPoint.mock.send
					.withArgs(
						1,
						dstContract.address,
						payload,
						empty1.address,
						zeroToken.address,
						'0x1234'
					)
					.returns()
				await mockEndPoint.mock.getOutboundNonce
					.withArgs(1, token.address)
					.returns(98)

				await token.mint(deployer.address, 100)
				await token.approve(other.address, 50)
				await token.setTrustedRemote(1, dstContract.address)

				const beforeBalance = await token.balanceOf(deployer.address)
				expect(beforeBalance.toString()).to.be.equal('100')

				await token
					.connect(other)
					.sendFrom(
						deployer.address,
						1,
						dstWallet.address,
						50,
						empty1.address,
						zeroToken.address,
						'0x1234',
						{
							value: ethers.utils.parseUnits('100', 'wei'),
						}
					)
				const afterBalance = await token.balanceOf(deployer.address)
				expect(afterBalance.toString()).to.be.equal('50')
			})
			it('generate event', async () => {
				const empty1 = ethers.Wallet.createRandom()
				const zeroToken = ethers.Wallet.createRandom()
				const dstWallet = ethers.Wallet.createRandom()
				const dstContract = ethers.Wallet.createRandom()
				const [deployer, other] = await ethers.getSigners()
				const coder = new ethers.utils.AbiCoder()
				const payload = coder.encode(
					['bytes', 'uint256'],
					[dstWallet.address, 50]
				)
				await mockEndPoint.mock.estimateFees
					.withArgs(1, token.address, payload, false, '0x1234')
					.returns(10, 20)
				await mockEndPoint.mock.send
					.withArgs(
						1,
						dstContract.address,
						payload,
						empty1.address,
						zeroToken.address,
						'0x1234'
					)
					.returns()
				await mockEndPoint.mock.getOutboundNonce
					.withArgs(1, token.address)
					.returns(98)

				await token.mint(deployer.address, 100)
				await token.approve(other.address, 50)
				await token.setTrustedRemote(1, dstContract.address)

				await expect(
					token
						.connect(other)
						.sendFrom(
							deployer.address,
							1,
							dstWallet.address,
							50,
							empty1.address,
							zeroToken.address,
							'0x1234',
							{
								value: ethers.utils.parseUnits('100', 'wei'),
							}
						)
				)
					.to.emit(token, 'SendToChain')
					.withArgs(deployer.address, 1, dstWallet.address, 50, 98)
			})
		})
		describe('fail', () => {
			it('do not approve.', async () => {
				const empty1 = ethers.Wallet.createRandom()
				const empty2 = ethers.Wallet.createRandom()
				const empty3 = ethers.Wallet.createRandom()
				const [deployer, other] = await ethers.getSigners()

				await expect(
					token
						.connect(other)
						.sendFrom(
							deployer.address,
							1,
							empty1.address,
							2,
							empty2.address,
							empty3.address,
							'0x'
						)
				).to.be.revertedWith('ERC20: insufficient allowance')
			})
			it('do not have token.', async () => {
				const empty1 = ethers.Wallet.createRandom()
				const empty2 = ethers.Wallet.createRandom()
				const empty3 = ethers.Wallet.createRandom()
				const [deployer, other] = await ethers.getSigners()
				await token.approve(other.address, 50)
				await expect(
					token
						.connect(other)
						.sendFrom(
							deployer.address,
							1,
							empty1.address,
							50,
							empty2.address,
							empty3.address,
							'0x'
						)
				).to.be.revertedWith('ERC20: burn amount exceeds balance')
			})
			it('trusted address is not set.', async () => {
				const empty1 = ethers.Wallet.createRandom()
				const empty2 = ethers.Wallet.createRandom()
				const empty3 = ethers.Wallet.createRandom()
				const [deployer, other] = await ethers.getSigners()
				await token.mint(deployer.address, 100)
				await token.approve(other.address, 50)
				await expect(
					token
						.connect(other)
						.sendFrom(
							deployer.address,
							1,
							empty1.address,
							50,
							empty2.address,
							empty3.address,
							'0x'
						)
				).to.be.revertedWith(
					'LzSend: destination chain is not a trusted source'
				)
			})
		})
	})
})

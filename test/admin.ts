import { expect, use } from 'chai'
import { ethers } from 'hardhat'
import { constants } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { deploy, deployProxy, makeSnapshot, resetChain } from './utils'
import { ExampleToken, Admin, UpgradeableProxy } from '../typechain-types'

use(solidity)

describe('Admin', () => {
	let proxy: UpgradeableProxy
	let exampleToken: ExampleToken
	let proxified: ExampleToken
	let admin: Admin
	let snapshot: string

	before(async () => {
		const data = ethers.utils.arrayify('0x')
		exampleToken = await deploy<ExampleToken>('ExampleToken')
		admin = await deploy<Admin>('Admin')
		proxy = await deployProxy(exampleToken.address, admin.address, data)
		proxified = exampleToken.attach(proxy.address)
		await proxified.initialize()
	})
	beforeEach(async () => {
		snapshot = await makeSnapshot()
	})
	afterEach(async () => {
		await resetChain(snapshot)
	})

	describe('upgrade', () => {
		describe('success', () => {
			it('upgrade logic contract', async () => {
				const impl1 = await admin.getProxyImplementation(proxy.address)
				const nextImpl = await deploy<ExampleToken>('ExampleToken')
				await admin.upgrade(proxy.address, nextImpl.address)
				const impl2 = await admin.getProxyImplementation(proxy.address)
				expect(impl1).to.not.equal(impl2)
				expect(impl1).to.equal(exampleToken.address)
				expect(impl2).to.equal(nextImpl.address)
			})
		})
		describe('fail', () => {
			it('should fail to upgrade when the caller is not admin', async () => {
				const nextImpl = await deploy<ExampleToken>('ExampleToken')
				const [, addr1] = await ethers.getSigners()
				await expect(
					admin.connect(addr1).upgrade(proxy.address, nextImpl.address)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})
	describe('getProxyImplementation', () => {
		describe('success', () => {
			it('get implementation address', async () => {
				const implementation = await admin.getProxyImplementation(proxy.address)
				expect(implementation).to.equal(exampleToken.address)
			})
		})
		describe('fail', () => {
			it('get implementation address', async () => {
				const [, addr1] = await ethers.getSigners()
				await expect(
					admin.connect(addr1).upgrade(proxy.address, constants.AddressZero)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})
	describe('getProxyAdmin', () => {
		describe('success', () => {
			it('get admin address', async () => {
				const impl = await admin.getProxyAdmin(proxy.address)
				expect(impl).to.equal(admin.address)
			})
			it('change admin address', async () => {
				const admin1 = await admin.getProxyAdmin(proxy.address)
				expect(admin1).to.equal(admin.address)
				const nextAdmin = await deploy<Admin>('Admin')
				await admin.changeProxyAdmin(proxy.address, nextAdmin.address)
				const admin2 = await nextAdmin.getProxyAdmin(proxy.address)
				expect(admin2).to.equal(nextAdmin.address)
			})
		})
		describe('fail', () => {
			it('get admin address', async () => {
				const [, addr1] = await ethers.getSigners()
				await expect(
					admin
						.connect(addr1)
						.changeProxyAdmin(proxy.address, constants.AddressZero)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})
})

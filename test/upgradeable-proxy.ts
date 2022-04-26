import { expect, use } from 'chai'
import { ethers } from 'hardhat'
import { solidity } from 'ethereum-waffle'
import { deploy, deployProxy, makeSnapshot, resetChain } from './utils'
import { Admin, ExampleToken, UpgradeableProxy } from '../typechain-types'

use(solidity)

describe('UpgradeableProxy', () => {
	let proxy: UpgradeableProxy
	let admin: Admin
	let exampleToken: ExampleToken
	let proxified: ExampleToken
	let snapshot: string

	before(async () => {
		const data = ethers.utils.arrayify('0x')
		exampleToken = await deploy<ExampleToken>('ExampleToken')
		admin = await deploy<Admin>('Admin')
		const [owner] = await ethers.getSigners()
		proxy = await deployProxy(exampleToken.address, admin.address, data)
		proxified = exampleToken.attach(proxy.address).connect(owner)
		await proxified.initialize()
	})
	beforeEach(async () => {
		snapshot = await makeSnapshot()
	})
	afterEach(async () => {
		await resetChain(snapshot)
	})

	describe('upgradeTo', () => {
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

			it('storing data', async () => {
				const nextImpl = await deploy<ExampleToken>('ExampleToken')
				await admin.upgrade(proxy.address, nextImpl.address)
				const name = await proxified.name()
				expect(name).to.equal('token')
			})
		})
		describe('fail', () => {
			it('should fail to upgrade when the caller is not admin', async () => {
				const nextImpl = await deploy<ExampleToken>('ExampleToken')
				const [, addr1] = await ethers.getSigners()
				const res = await admin
					.connect(addr1)
					.upgrade(proxy.address, nextImpl.address)
					// eslint-disable-next-line max-nested-callbacks
					.catch((err: Error) => err)
				const impl1 = await admin.getProxyImplementation(proxy.address)
				expect(res).to.be.instanceOf(Error)
				expect(impl1).to.be.equal(exampleToken.address)
			})
		})
	})
})

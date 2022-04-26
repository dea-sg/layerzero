import { ethers, network } from 'hardhat'
import { Contract } from 'ethers'
import { UpgradeableProxy, UpgradeableProxy__factory } from '../typechain-types'

export const deploy = async <C extends Contract>(name: string): Promise<C> => {
	const factory = await ethers.getContractFactory(name)
	const contract = await factory.deploy()

	await contract.deployed()
	return contract as C
}

export const deployProxy = async (
	logic: string,
	admin: string,
	data: Readonly<Uint8Array>
): Promise<UpgradeableProxy> => {
	const factory = (await ethers.getContractFactory(
		'UpgradeableProxy'
	)) as UpgradeableProxy__factory
	const contract = await factory.deploy(logic, admin, data)

	await contract.deployed()
	return contract
}

export const makeSnapshot = async (): Promise<string> => {
	const snapshot = await network.provider.request({ method: 'evm_snapshot' })
	return typeof snapshot === 'string' ? snapshot : ''
}

export const resetChain = async (snapshot: string): Promise<void> => {
	await network.provider.request({
		method: 'evm_revert',
		params: [snapshot],
	})
}

import { ethers, network } from 'hardhat'
import { Contract } from 'ethers'
import { TestUtils } from '../typechain-types'

export const deploy = async <C extends Contract>(name: string): Promise<C> => {
	const factory = await ethers.getContractFactory(name)
	const contract = await factory.deploy()

	await contract.deployed()
	return contract as C
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

export const makeRoleErrorMessage = async (
	testUtils: TestUtils,
	account: string,
	rore: string
): Promise<string> => {
	const address = await testUtils.convertAddressToString(account)
	const walletRole = await testUtils.convertBytes32ToString(rore)
	return `AccessControl: account ${address} is missing role ${walletRole}`
}

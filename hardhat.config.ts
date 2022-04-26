/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import "@nomiclabs/hardhat-etherscan"
import * as dotenv from 'dotenv'

dotenv.config()

const mnemnoc =
	typeof process.env.MNEMONIC === 'undefined' ? '' : process.env.MNEMONIC

const config = {
	solidity: {
		version: '0.8.9',
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		rinkeby: {
			url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ARCHEMY_KEY!}`,
			gas: 4712388,
			accounts: {
				mnemonic: mnemnoc,
			},
		},
		polygonMumbai: {
			url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ARCHEMY_KEY!}`,
			accounts: {
				mnemonic: mnemnoc,
			},
		},
	},
	etherscan: {
		apiKey: {
			rinkeby: process.env.ETHERSCAN_API_KEY!,
			polygonMumbai: process.env.POLYGONSCAN_API_KEY!,
		}
	  }
}

export default config

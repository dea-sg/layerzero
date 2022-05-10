# Layer Zero base contract

## disclaimer

We do not guarantee the validity or accuracy of the sources.
Use at your own risk.

## how to use

### install command

```
yarn add @dea-sg/layerzero
or
npm install @dea-sg/layerzero
```

### create contract

If you want to create a LayerZero compliant ERC20

```
import "@dea-sg/layerzero/contracts/ERC20/OmniERC20Upgradeable.sol";

contract Token is OmniERC20Upgradeable {
	function initialize(
		string memory _name,
		string memory _symbol,
		address _endpoint
	) external initializer {
		__OmniERC20_init(_name, _symbol, _endpoint);
	}
}
```

If you want to create a LayerZero compliant ERC721

```
import "@dea-sg/layerzero/contracts/ERC721/OmniERC721Upgradeable.sol";

contract Nft is OmniERC721Upgradeable {
	function initialize(
		string memory _name,
		string memory _symbol,
		address _endpoint
	) external initializer {
		__OmniERC721_init(_name, _symbol, _endpoint);
	}
}
```

After creating the contract, deploy it to the required chain.
Note that this contract supports the proxy pattern.

### initialize

After deployment, execute the initialize function for each contract.

Set name and symbol to anything you like, and endpoint to [here](https://layerzero.gitbook.io/docs/technical-reference/testnet/testnet-addresses).

For example, for Rinkeby, set 0x79a63d6d8BBD5c6dfc774dA79bCcD948EAcb53FA.

### setTrustedRemote

Execute the setTrustedRemote function. This function is used to set the trusted remote.

For example, if you deploy to Ethereum rinkeby or Polygon mumbai, the setTrustedRemote of the contract deployed to rinkeby sets the mumbai chain ID and the address of the contract deployed to mumbai.

The setTrustedRemote of the contract deployed in mumbai is set to the chain ID of rinkeby and the address of the contract deployed in rinkeby.

The chain ID for rinkeby is 10001 and for mumbai is 10009.

### how to move

Executing the send function sends the token to another chain.

Naturally, the balance must be in the wallet where the send function is executed. Please mint in advance.

The send function is payable, For example, when you send a token from Ethreum mainnet to polygon, you should grant 0.1ether and run it.

This is the gas cost to move the destination chain. If it is too much, it will be returned to \_refundAddress.

Argument information is as follows

\_dstChainId：[chain ID](https://layerzero.gitbook.io/docs/technical-reference/testnet/testnet-addresses)

\_toAddress：Address of the destination chain

\_amount：Number of tokens to be sent

\_refundAddress：destination chain

\_zroPaymentAddress：This is for future functionality extensions. For now, set a null address.

\_adapterParams：This is for future functionality. Leave it as 0x for now.

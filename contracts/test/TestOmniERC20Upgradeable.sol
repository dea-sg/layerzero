// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../ERC20/OmniERC20Upgradeable.sol";

contract TestOmniERC20Upgradeable is OmniERC20Upgradeable {
	function initialize(
		string memory _name,
		string memory _symbol,
		address _endpoint
	) external initializer {
		__OmniERC20_init(_name, _symbol, _endpoint);
	}

	function mint(address _account, uint256 _amount)
		external
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		_mint(_account, _amount);
	}

	function executeNonblockingLzReceive(
		uint16 _srcChainId,
		bytes memory _srcAddress,
		uint64 _nonce,
		bytes memory _payload
	) external {
		_nonblockingLzReceive(_srcChainId, _srcAddress, _nonce, _payload);
	}
}

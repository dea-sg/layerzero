// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../ERC721/OmniERC721Upgradeable.sol";

contract TestOmniERC721Upgradeable is OmniERC721Upgradeable {
	function initialize(
		string memory _name,
		string memory _symbol,
		address _endpoint
	) external initializer {
		__OmniERC721_init(_name, _symbol, _endpoint);
	}

	function mint(address _account, uint256 _tokenId) external {
		_mint(_account, _tokenId);
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

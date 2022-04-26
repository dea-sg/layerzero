// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../base/NonblockingUpgradeable.sol";

contract TestNonblockingUpgradeable is NonblockingUpgradeable {
	uint256 public status = 0;

	event Executed(
		uint16 _srcChainId,
		bytes _srcAddress,
		uint64 _nonce,
		bytes _payload
	);

	function initialize(address _endpoint) external initializer {
		__Nonblocking_init(_endpoint);
	}

	function blockingLzReceive(
		uint16 _srcChainId,
		bytes memory _srcAddress,
		uint64 _nonce,
		bytes memory _payload
	) external {
		_blockingLzReceive(_srcChainId, _srcAddress, _nonce, _payload);
	}

	function _nonblockingLzReceive(
		uint16 _srcChainId,
		bytes memory _srcAddress,
		uint64 _nonce,
		bytes memory _payload
	) internal virtual override {
		if (status == 0) {
			emit Executed(_srcChainId, _srcAddress, _nonce, _payload);
		} else if (status == 1) {
			revert("error!!!!");
		} else if (status == 2) {
			abi.decode(_payload, (bytes, uint256));
		}
	}

	function changeStatus(uint256 _status) external {
		status = _status;
	}

	function setFailedMessage(
		uint16 _key1,
		bytes memory _key2,
		uint256 _key3,
		bytes32 _value
	) external {
		failedMessages[_key1][_key2][_key3] = _value;
	}

	function getFailedMessage(
		uint16 _key1,
		bytes memory _key2,
		uint256 _key3
	) external view returns (bytes32) {
		return failedMessages[_key1][_key2][_key3];
	}
}

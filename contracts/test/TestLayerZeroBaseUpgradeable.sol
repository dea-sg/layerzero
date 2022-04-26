// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../base/LayerZeroBaseUpgradeable.sol";

contract TestLayerZeroBaseUpgradeable is LayerZeroBaseUpgradeable {
	event Executed(
		uint16 _srcChainId,
		bytes _srcAddress,
		uint64 _nonce,
		bytes _payload
	);

	function initialize(address _endpoint) external initializer {
		__LayerZeroBase_init(_endpoint);
	}

	function _blockingLzReceive(
		uint16 _srcChainId,
		bytes memory _srcAddress,
		uint64 _nonce,
		bytes memory _payload
	) internal virtual override {
		emit Executed(_srcChainId, _srcAddress, _nonce, _payload);
	}

	function lzSend(
		uint16 _dstChainId,
		bytes memory _payload,
		address payable _refundAddress,
		address _zroPaymentAddress,
		bytes memory _adapterParams
	) external payable {
		_lzSend(
			_dstChainId,
			_payload,
			_refundAddress,
			_zroPaymentAddress,
			_adapterParams
		);
	}
}

// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "../interfaces/ILayerZeroReceiver.sol";

contract TestEndPoint {
	address public lzBase;

	function setLzBase(address _lzBase) external {
		lzBase = _lzBase;
	}

	function executeLsReceive(
		uint16 _srcChainId,
		bytes memory _srcAddress,
		uint64 _nonce,
		bytes memory _payload
	) external {
		ILayerZeroReceiver(lzBase).lzReceive(
			_srcChainId,
			_srcAddress,
			_nonce,
			_payload
		);
	}
}

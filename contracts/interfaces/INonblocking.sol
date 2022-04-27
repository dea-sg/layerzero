// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

interface INonblocking {
	/**
	 * @dev retry error message
	 * @param _srcChainId source chain id
	 * @param _srcAddress source address
	 * @param _nonce message nonce
	 * @param _payload argments
	 */
	function retryMessage(
		uint16 _srcChainId,
		bytes memory _srcAddress,
		uint64 _nonce,
		bytes calldata _payload
	) external;

	/**
	 * @dev When a message is received, it is emit if an error occurs
	 */
	event MessageFailed(
		uint16 _srcChainId,
		bytes _srcAddress,
		uint64 _nonce,
		bytes _payload,
		string _errStr,
		bytes _errBytes
	);
}

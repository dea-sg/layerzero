// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

interface ILayerZeroBase {
	event SetTrustedRemote(uint16 _srcChainId, bytes _srcAddress);

	/**
	 * @dev check block list
	 * @param _chainId - the chainId for the pending config change
	 * @param _configType - type of configuration. every messaging library has its own convention.
	 * @return bytes config
	 */
	function getConfig(
		uint16,
		uint16 _chainId,
		address,
		uint256 _configType
	) external view returns (bytes memory);

	/**
	 * @dev set src address
	 * @param _srcChainId chain id
	 * @param _srcAddress src address
	 */
	function setTrustedRemote(uint16 _srcChainId, bytes calldata _srcAddress)
		external;

	/**
	 * @dev check trusted address
	 * @param _srcChainId chain id
	 * @param _srcAddress src address
	 * @return bool if the address is trusted, return true
	 */
	function isTrustedRemote(uint16 _srcChainId, bytes calldata _srcAddress)
		external
		view
		returns (bool);

	/**
	 * @dev get trusted address
	 * @param _chainId chain id
	 * @return bytes trusted address
	 */
	function getTrustedRemote(uint16 _chainId)
		external
		view
		returns (bytes memory);

	/**
	 * @dev get endpoint address
	 * @return address endpoint address
	 */
	function getLzEndpoint() external view returns (address);
}

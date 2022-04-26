// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/**
 * @dev Interface of the OFT standard
 */
interface IOmniERC20 is IERC20Upgradeable {
	/**
	 * @dev send `_amount` amount of token to (`_dstChainId`, `_toAddress`)
	 * @param _dstChainId the destination chain identifier
	 * @param _toAddress can be any size depending on the `dstChainId`.
	 * @param _amount the quantity of tokens in wei
	 * @param _refundAddress the address LayerZero refunds if too much message fee is sent
	 * @param _zroPaymentAddress set to address(0x0) if not paying in ZRO (LayerZero Token)
	 * @param _adapterParams is a flexible bytes array to indicate messaging adapter services
	 */
	function send(
		uint16 _dstChainId,
		bytes calldata _toAddress,
		uint256 _amount,
		address payable _refundAddress,
		address _zroPaymentAddress,
		bytes calldata _adapterParams
	) external payable;

	/**
	 * @dev send `_amount` amount of token to (`_dstChainId`, `_toAddress`) from `_from`
	 * @param _from from address
	 * @param _dstChainId the destination chain identifier
	 * @param _toAddress can be any size depending on the `dstChainId`.
	 * @param _amount the quantity of tokens in wei
	 * @param _refundAddress the address LayerZero refunds if too much message fee is sent
	 * @param _zroPaymentAddress set to address(0x0) if not paying in ZRO (LayerZero Token)
	 * @param _adapterParams is a flexible bytes array to indicate messaging adapter services
	 */
	function sendFrom(
		address _from,
		uint16 _dstChainId,
		bytes calldata _toAddress,
		uint256 _amount,
		address payable _refundAddress,
		address _zroPaymentAddress,
		bytes calldata _adapterParams
	) external payable;

	/**
	 * @dev get gas fee
	 * @return _nativeFee native fee
	 * @return _zroFee zero fee
	 * @param _dstChainId the destination chain identifier
	 * @param _toAddress can be any size depending on the `dstChainId`.
	 * @param _useZro Set to true if zero token is used.
	 * @param _amount the quantity of tokens in wei
	 * @param _adapterParams is a flexible bytes array to indicate messaging adapter services
	 */
	function estimateSendFee(
		uint16 _dstChainId,
		bytes calldata _toAddress,
		bool _useZro,
		uint256 _amount,
		bytes calldata _adapterParams
	) external view returns (uint256 _nativeFee, uint256 _zroFee);

	/**
	 * @dev Emitted when `_amount` tokens are moved from the `_sender` to (`_dstChainId`, `_toAddress`)
	 * `_nonce` is the outbound nonce
	 */
	event SendToChain(
		address indexed _sender,
		uint16 indexed _dstChainId,
		bytes indexed _toAddress,
		uint256 _amount,
		uint64 _nonce
	);

	/**
     * @dev Emitted when `_amount` tokens are received from `_srcChainId` into the `_toAddress` on the local chain.
     `_nonce` is the inbound nonce.
     */
	event ReceiveFromChain(
		uint16 _srcChainId,
		address _toAddress,
		uint256 _amount,
		uint64 _nonce
	);
}

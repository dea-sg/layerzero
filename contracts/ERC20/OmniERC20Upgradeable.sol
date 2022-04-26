// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "../base/NonblockingUpgradeable.sol";
import "../interfaces/IOmniERC20.sol";

contract OmniERC20Upgradeable is
	ERC20Upgradeable,
	NonblockingUpgradeable,
	IOmniERC20
{
	// solhint-disable-next-line func-name-mixedcase
	function __OmniERC20_init(
		string memory _name,
		string memory _symbol,
		address _endpoint
	) public onlyInitializing {
		__ERC20_init(_name, _symbol);
		__Nonblocking_init(_endpoint);
	}

	function send(
		uint16 _dstChainId,
		bytes calldata _toAddress,
		uint256 _amount,
		address payable _refundAddress,
		address _zroPaymentAddress,
		bytes calldata _adapterParams
	) external payable virtual override {
		_send(
			_msgSender(),
			_dstChainId,
			_toAddress,
			_amount,
			_refundAddress,
			_zroPaymentAddress,
			_adapterParams
		);
	}

	function sendFrom(
		address _from,
		uint16 _dstChainId,
		bytes calldata _toAddress,
		uint256 _amount,
		address payable _refundAddress,
		address _zroPaymentAddress,
		bytes calldata _adapterParams
	) external payable virtual override {
		_spendAllowance(_from, _msgSender(), _amount);
		_send(
			_from,
			_dstChainId,
			_toAddress,
			_amount,
			_refundAddress,
			_zroPaymentAddress,
			_adapterParams
		);
	}

	function estimateSendFee(
		uint16 _dstChainId,
		bytes calldata _toAddress,
		bool _useZro,
		uint256 _amount,
		bytes calldata _adapterParams
	)
		external
		view
		virtual
		override
		returns (uint256 nativeFee, uint256 zroFee)
	{
		// mock the payload for send()
		bytes memory payload = abi.encode(_toAddress, _amount);
		return
			lzEndpoint.estimateFees(
				_dstChainId,
				address(this),
				payload,
				_useZro,
				_adapterParams
			);
	}

	function _nonblockingLzReceive(
		uint16 _srcChainId,
		bytes memory, // _srcAddress
		uint64 _nonce,
		bytes memory _payload
	) internal virtual override {
		// decode and load the toAddress
		(bytes memory toAddressBytes, uint256 amount) = abi.decode(
			_payload,
			(bytes, uint256)
		);
		address toAddress;
		// solhint-disable-next-line no-inline-assembly
		assembly {
			toAddress := mload(add(toAddressBytes, 20))
		}

		_creditTo(_srcChainId, toAddress, amount);

		emit ReceiveFromChain(_srcChainId, toAddress, amount, _nonce);
	}

	function _send(
		address _from,
		uint16 _dstChainId,
		bytes memory _toAddress,
		uint256 _amount,
		address payable _refundAddress,
		address _zroPaymentAddress,
		bytes calldata _adapterParams
	) internal virtual {
		_debitFrom(_from, _dstChainId, _toAddress, _amount);

		bytes memory payload = abi.encode(_toAddress, _amount);
		_lzSend(
			_dstChainId,
			payload,
			_refundAddress,
			_zroPaymentAddress,
			_adapterParams
		);

		uint64 nonce = lzEndpoint.getOutboundNonce(_dstChainId, address(this));
		emit SendToChain(_from, _dstChainId, _toAddress, _amount, nonce);
	}

	// on transfer - OFT burns tokens on the source chainanoz
	function _debitFrom(
		address _from,
		uint16,
		bytes memory,
		uint256 _amount
	) internal virtual {
		_burn(_from, _amount);
	}

	function _creditTo(
		uint16,
		address _toAddress,
		uint256 _amount
	) internal virtual {
		_mint(_toAddress, _amount);
	}
}

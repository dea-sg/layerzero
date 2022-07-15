// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "../interfaces/ILayerZeroReceiver.sol";
import "../interfaces/ILayerZeroUserApplicationConfig.sol";
import "../interfaces/ILayerZeroEndpoint.sol";
import "../interfaces/ILayerZeroBase.sol";

/*
 * a generic LzReceiver implementation
 */
abstract contract LayerZeroBaseUpgradeable is
	AccessControlEnumerableUpgradeable,
	ILayerZeroBase,
	ILayerZeroReceiver,
	ILayerZeroUserApplicationConfig
{
	ILayerZeroEndpoint internal lzEndpoint;

	mapping(uint16 => bytes) internal trustedRemoteLookup;

	// solhint-disable-next-line func-name-mixedcase
	function __LayerZeroBase_init(address _endpoint) internal onlyInitializing {
		__AccessControlEnumerable_init();
		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
		lzEndpoint = ILayerZeroEndpoint(_endpoint);
	}

	function supportsInterface(bytes4 interfaceId)
		public
		view
		virtual
		override
		returns (bool)
	{
		return
			interfaceId == type(ILayerZeroBase).interfaceId ||
			interfaceId == type(ILayerZeroReceiver).interfaceId ||
			interfaceId == type(ILayerZeroUserApplicationConfig).interfaceId ||
			super.supportsInterface(interfaceId);
	}

	function setEndpoint(address _endpoint)
		external
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		lzEndpoint = ILayerZeroEndpoint(_endpoint);
	}

	function lzReceive(
		uint16 _srcChainId,
		bytes memory _srcAddress,
		uint64 _nonce,
		bytes memory _payload
	) external override {
		// lzReceive must be called by the endpoint for security
		require(
			_msgSender() == address(lzEndpoint),
			"LzReceiver: illegal access"
		);
		require(
			keccak256(_srcAddress) != keccak256(bytes("")),
			"LzReceiver: illegal address"
		);
		// if will still block the message pathway from (srcChainId, srcAddress). should not receive message from untrusted remote.
		// solhint-disable-next-line reason-string
		require(
			_srcAddress.length == trustedRemoteLookup[_srcChainId].length &&
				keccak256(_srcAddress) ==
				keccak256(trustedRemoteLookup[_srcChainId]),
			"LzReceiver: invalid source sending contract"
		);

		_blockingLzReceive(_srcChainId, _srcAddress, _nonce, _payload);
	}

	// abstract function - the default behaviour of LayerZero is blocking. See: NonblockingLzApp if you dont need to enforce ordered messaging
	function _blockingLzReceive(
		uint16 _srcChainId,
		bytes memory _srcAddress,
		uint64 _nonce,
		bytes memory _payload
	) internal virtual;

	function _lzSend(
		uint16 _dstChainId,
		bytes memory _payload,
		address payable _refundAddress,
		address _zroPaymentAddress,
		bytes memory _adapterParams
	) internal {
		// solhint-disable-next-line reason-string
		require(
			trustedRemoteLookup[_dstChainId].length != 0,
			"LzSend: destination chain is not a trusted source"
		);
		// We will respond when the ZERO token is released.
		(uint256 messageFee, ) = lzEndpoint.estimateFees(
			_dstChainId,
			address(this),
			_payload,
			false,
			_adapterParams
		);
		// solhint-disable-next-line reason-string
		require(
			msg.value >= messageFee,
			"LzSend: Must send enough value to cover messageFee"
		);
		// We will respond when the ZERO token is released.
		// solhint-disable-next-line  check-send-result
		lzEndpoint.send{value: msg.value}(
			_dstChainId,
			trustedRemoteLookup[_dstChainId],
			_payload,
			_refundAddress,
			_zroPaymentAddress,
			_adapterParams
		);
	}

	//---------------------------UserApplication config----------------------------------------
	function getConfig(
		uint16,
		uint16 _chainId,
		address,
		uint256 _configType
	) external view returns (bytes memory) {
		return
			lzEndpoint.getConfig(
				lzEndpoint.getSendVersion(address(this)),
				_chainId,
				address(this),
				_configType
			);
	}

	// generic config for LayerZero user Application
	function setConfig(
		uint16 _version,
		uint16 _chainId,
		uint256 _configType,
		bytes calldata _config
	) external override onlyRole(DEFAULT_ADMIN_ROLE) {
		lzEndpoint.setConfig(_version, _chainId, _configType, _config);
	}

	function setSendVersion(uint16 _version)
		external
		override
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		lzEndpoint.setSendVersion(_version);
	}

	function setReceiveVersion(uint16 _version)
		external
		override
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		lzEndpoint.setReceiveVersion(_version);
	}

	function forceResumeReceive(uint16 _srcChainId, bytes calldata _srcAddress)
		external
		override
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		lzEndpoint.forceResumeReceive(_srcChainId, _srcAddress);
	}

	// allow owner to set it multiple times.
	function setTrustedRemote(uint16 _srcChainId, bytes calldata _srcAddress)
		external
		onlyRole(DEFAULT_ADMIN_ROLE)
	{
		trustedRemoteLookup[_srcChainId] = _srcAddress;
		emit SetTrustedRemote(_srcChainId, _srcAddress);
	}

	function isTrustedRemote(uint16 _srcChainId, bytes calldata _srcAddress)
		external
		view
		returns (bool)
	{
		bytes memory trustedSource = trustedRemoteLookup[_srcChainId];
		return keccak256(trustedSource) == keccak256(_srcAddress);
	}

	//--------------------------- VIEW FUNCTION ----------------------------------------
	// interacting with the LayerZero Endpoint and remote contracts

	function getTrustedRemote(uint16 _chainId)
		external
		view
		returns (bytes memory)
	{
		return trustedRemoteLookup[_chainId];
	}

	function getLzEndpoint() external view returns (address) {
		return address(lzEndpoint);
	}
}

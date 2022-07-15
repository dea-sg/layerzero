// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "./LayerZeroBaseUpgradeable.sol";
import "../interfaces/INonblocking.sol";

/*
 * the default LayerZero messaging behaviour is blocking, i.e. any failed message will block the channel
 * this abstract class try-catch all fail messages and store locally for future retry. hence, non-blocking
 * NOTE: if the srcAddress is not configured properly, it will still block the message pathway from (srcChainId, srcAddress)
 */
abstract contract NonblockingUpgradeable is
	LayerZeroBaseUpgradeable,
	INonblocking
{
	mapping(uint16 => mapping(bytes => mapping(uint256 => bytes32)))
		public failedMessages;

	// solhint-disable-next-line func-name-mixedcase
	function __Nonblocking_init(address _endpoint) internal onlyInitializing {
		__LayerZeroBase_init(_endpoint);
	}

	function supportsInterface(bytes4 _interfaceId)
		public
		view
		virtual
		override
		returns (bool)
	{
		return
			_interfaceId == type(INonblocking).interfaceId ||
			super.supportsInterface(_interfaceId);
	}

	// overriding the virtual function in LzReceiver
	function _blockingLzReceive(
		uint16 _srcChainId,
		bytes memory _srcAddress,
		uint64 _nonce,
		bytes memory _payload
	) internal virtual override {
		// try-catch all errors/exceptions
		try
			this.nonblockingLzReceive(
				_srcChainId,
				_srcAddress,
				_nonce,
				_payload
			)
		{
			// do nothing
		} catch Error(string memory _err) {
			failedMessages[_srcChainId][_srcAddress][_nonce] = keccak256(
				_payload
			);
			emit MessageFailed(
				_srcChainId,
				_srcAddress,
				_nonce,
				_payload,
				_err
			);
		} catch (bytes memory _err) {
			failedMessages[_srcChainId][_srcAddress][_nonce] = keccak256(
				_payload
			);
			emit MessageFailed(
				_srcChainId,
				_srcAddress,
				_nonce,
				_payload,
				string(_err)
			);
		}
	}

	function nonblockingLzReceive(
		uint16 _srcChainId,
		bytes memory _srcAddress,
		uint64 _nonce,
		bytes memory _payload
	) public {
		// only internal transaction
		// solhint-disable-next-line reason-string
		require(
			_msgSender() == address(this),
			"LzReceiver: caller must be Bridge"
		);
		_nonblockingLzReceive(_srcChainId, _srcAddress, _nonce, _payload);
	}

	//@notice override this function
	function _nonblockingLzReceive(
		uint16 _srcChainId,
		bytes memory _srcAddress,
		uint64 _nonce,
		bytes memory _payload
	) internal virtual;

	function retryMessage(
		uint16 _srcChainId,
		bytes memory _srcAddress,
		uint64 _nonce,
		bytes calldata _payload
	) external onlyRole(DEFAULT_ADMIN_ROLE) {
		// assert there is message to retry
		bytes32 payloadHash = failedMessages[_srcChainId][_srcAddress][_nonce];
		require(payloadHash != bytes32(0), "LzReceiver: no stored message");
		require(
			keccak256(_payload) == payloadHash,
			"LzReceiver: invalid payload"
		);
		// clear the stored message
		failedMessages[_srcChainId][_srcAddress][_nonce] = bytes32(0);
		// execute the message. revert if it fails again
		_nonblockingLzReceive(_srcChainId, _srcAddress, _nonce, _payload);
	}
}

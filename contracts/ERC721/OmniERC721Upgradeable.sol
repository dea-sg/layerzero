// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../base/NonblockingUpgradeable.sol";
import "../interfaces/IOmniERC721.sol";

/*
 * When deploying NFT on multiple chains, duplicate token id's must be avoided
 * As a countermeasure, there is a way to limit the range of token IDs issued for each chain.
 *
 *
 * uint256 public nextMintId = 100;
 * uint256 public maxMintId = 200;
 *
 * function mint() exernal {
 *     require(nextMintId <= maxMintId, "ERC721: Max Mint limit reached");
 *
 *     uint newId = nextMintId;
 *     nextMintId++;
 *
 *     _mint(msg.sender, newId);
 * }
 *
 */
contract OmniERC721Upgradeable is
	ERC721Upgradeable,
	NonblockingUpgradeable,
	IOmniERC721
{
	// solhint-disable-next-line func-name-mixedcase
	function __OmniERC721_init(
		string memory _name,
		string memory _symbol,
		address _endpoint
	) internal onlyInitializing {
		__ERC721_init(_name, _symbol);
		__Nonblocking_init(_endpoint);
	}

	function supportsInterface(bytes4 _interfaceId)
		public
		view
		virtual
		override(ERC721Upgradeable, NonblockingUpgradeable)
		returns (bool)
	{
		return
			_interfaceId == type(IOmniERC721).interfaceId ||
			ERC721Upgradeable.supportsInterface(_interfaceId) ||
			NonblockingUpgradeable.supportsInterface(_interfaceId);
	}

	function sendFrom(
		address _from,
		uint16 _dstChainId,
		bytes calldata _toAddress,
		uint256 _tokenId,
		address payable _refundAddress,
		address _zroPaymentAddress,
		bytes calldata _adapterParams
	) external payable virtual override {
		_send(
			_from,
			_dstChainId,
			_toAddress,
			_tokenId,
			_refundAddress,
			_zroPaymentAddress,
			_adapterParams
		);
	}

	function estimateSendFee(
		uint16 _dstChainId,
		bytes calldata _toAddress,
		uint256 _tokenId,
		bool _useZro,
		bytes calldata _adapterParams
	) public view virtual returns (uint256 nativeFee, uint256 zroFee) {
		// mock the payload for send()
		bytes memory payload = abi.encode(_toAddress, _tokenId);
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
		(bytes memory toAddressBytes, uint256 tokenId) = abi.decode(
			_payload,
			(bytes, uint256)
		);
		address toAddress;
		// solhint-disable-next-line no-inline-assembly
		assembly {
			toAddress := mload(add(toAddressBytes, 20))
		}

		_creditTo(_srcChainId, toAddress, tokenId);

		emit ReceiveFromChain(_srcChainId, toAddress, tokenId, _nonce);
	}

	function _send(
		address _from,
		uint16 _dstChainId,
		bytes memory _toAddress,
		uint256 _tokenId,
		address payable _refundAddress,
		address _zroPaymentAddress,
		bytes calldata _adapterParams
	) internal virtual {
		_debitFrom(_from, _dstChainId, _toAddress, _tokenId);

		bytes memory payload = abi.encode(_toAddress, _tokenId);
		_lzSend(
			_dstChainId,
			payload,
			_refundAddress,
			_zroPaymentAddress,
			_adapterParams
		);

		uint64 nonce = lzEndpoint.getOutboundNonce(_dstChainId, address(this));
		emit SendToChain(_from, _dstChainId, _toAddress, _tokenId, nonce);
	}

	function _debitFrom(
		address _from,
		uint16,
		bytes memory,
		uint256 _tokenId
	) private {
		// solhint-disable-next-line reason-string
		require(
			_isApprovedOrOwner(_msgSender(), _tokenId),
			"ERC721: send caller is not owner nor approved"
		);
		// solhint-disable-next-line reason-string
		require(
			ownerOf(_tokenId) == _from,
			"ERC721: send from incorrect owner"
		);
		_burn(_tokenId);
	}

	function _creditTo(
		uint16,
		address _toAddress,
		uint256 _tokenId
	) private {
		_mint(_toAddress, _tokenId);
	}
}

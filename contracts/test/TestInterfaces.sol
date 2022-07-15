// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/access/IAccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "../interfaces/ILayerZeroBase.sol";
import "../interfaces/ILayerZeroReceiver.sol";
import "../interfaces/ILayerZeroUserApplicationConfig.sol";
import "../interfaces/INonblocking.sol";
import "../interfaces/IOmniERC20.sol";
import "../interfaces/IOmniERC721.sol";

contract TestInterfaceId {
	function getLayerZeroBaseId() external pure returns (bytes4) {
		return type(ILayerZeroBase).interfaceId;
	}

	function getLayerZeroReceiverId() external pure returns (bytes4) {
		return type(ILayerZeroReceiver).interfaceId;
	}

	function getLayerZeroUserApplicationConfigId()
		external
		pure
		returns (bytes4)
	{
		return type(ILayerZeroUserApplicationConfig).interfaceId;
	}

	function getAccessControlEnumerableUpgradeableId()
		external
		pure
		returns (bytes4)
	{
		return type(IAccessControlEnumerableUpgradeable).interfaceId;
	}

	function getNonblockingId() external pure returns (bytes4) {
		return type(INonblocking).interfaceId;
	}

	function getOmniERC20Id() external pure returns (bytes4) {
		return type(IOmniERC20).interfaceId;
	}

	function getOmniERC721Id() external pure returns (bytes4) {
		return type(IOmniERC721).interfaceId;
	}

	function getERC20UpgradeableId() external pure returns (bytes4) {
		return type(IERC20Upgradeable).interfaceId;
	}

	function getERC20MetadataUpgradeableId() external pure returns (bytes4) {
		return type(IERC20MetadataUpgradeable).interfaceId;
	}

	function getERC721UpgradeableId() external pure returns (bytes4) {
		return type(IERC721Upgradeable).interfaceId;
	}
}

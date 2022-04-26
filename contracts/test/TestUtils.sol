// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

contract TestUtils {
	function convertAddressToString(address _account)
		external
		pure
		returns (string memory)
	{
		return StringsUpgradeable.toHexString(uint160(_account), 20);
	}

	function convertBytes32ToString(bytes32 _role)
		external
		pure
		returns (string memory)
	{
		return StringsUpgradeable.toHexString(uint256(_role), 32);
	}
}

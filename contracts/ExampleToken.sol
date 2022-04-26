// SPDX-License-Identifier: MPL-2.0
pragma solidity =0.8.9;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract ExampleToken is ERC20Upgradeable {
	function initialize() public initializer {
		__ERC20_init("token", "TOKEN");
	}
}

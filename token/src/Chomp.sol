// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Monad Pet Chomp
/// @notice Fixed-supply utility token for the Monad Pet.
contract Chomp is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 ether;

    constructor(address recipient) ERC20("Monad Pet Chomp", "CHOMP") {
        _mint(recipient, INITIAL_SUPPLY);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {Chomp} from "../src/Chomp.sol";

contract ChompTest is Test {
    function testFixedSupplyAndMetadata() public {
        address recipient = makeAddr("recipient");
        Chomp token = new Chomp(recipient);
        assertEq(token.name(), "Monad Pet Chomp");
        assertEq(token.symbol(), "CHOMP");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 1_000_000_000 ether);
        assertEq(token.balanceOf(recipient), token.totalSupply());
    }

    function testNoAdditionalMintPath() public {
        Chomp token = new Chomp(address(this));
        assertEq(token.totalSupply(), 1_000_000_000 ether);
        (bool success,) = address(token).call(abi.encodeWithSignature("mint(address,uint256)", address(this), 1));
        assertFalse(success);
    }
}

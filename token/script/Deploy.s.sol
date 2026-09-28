// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {Chomp} from "../src/Chomp.sol";

contract Deploy is Script {
    function run(address recipient) external returns (Chomp token) {
        require(block.chainid == 10143, "Monad testnet only");
        vm.startBroadcast();
        token = new Chomp(recipient);
        vm.stopBroadcast();
    }
}

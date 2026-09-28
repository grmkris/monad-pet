// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {LaunchConfig as C} from "../src/LaunchConfig.sol";
import {IPositionManager, IUniversalRouter} from "../src/Interfaces.sol";

/// @notice Return exact calldata for cast send; this script never broadcasts.
contract BuildCalldata is Script {
    function seed(address token, address owner, uint256 deadline) external pure returns (bytes memory) {
        return abi.encodeCall(IPositionManager.multicall, (C.seedCalls(token, owner, deadline)));
    }

    function swap(address token, uint256 deadline) external pure returns (bytes memory) {
        return abi.encodeCall(IUniversalRouter.execute, (hex"10", C.swapInputs(token, C.SWAP_MIN_OUT), deadline));
    }
}

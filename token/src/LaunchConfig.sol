// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PoolKey, IPositionManager} from "./Interfaces.sol";

/// @notice Calldata builders only; no additional contract needs to be deployed.
library LaunchConfig {
    address internal constant POOL_MANAGER = 0x451D64ab3b650040d2aE1886602b97ed6eDc643d;
    address internal constant POSITION_MANAGER = 0x3Bb14E3D0Cd50aBe3EdACa06d06c29C78676C31A;
    address internal constant ROUTER = 0x1b7bFCd2870329B987191910D85c22C7287f3c22;
    address internal constant STATE_VIEW = 0xB639209539c61BaF67AC04876315786F8D0b153c;
    address internal constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    uint128 internal constant MON_MAX = 0.4 ether;
    uint128 internal constant CHOMP_MAX = 400_000 ether;
    uint128 internal constant LIQUIDITY = 400 ether;
    // sqrt(1,000,000 CHOMP / MON) * 2**96. Both currencies have 18 decimals.
    uint160 internal constant SQRT_PRICE_X96 = 79_228_162_514_264_337_593_543_950_336_000;
    int24 internal constant LOWER = -887220;
    int24 internal constant UPPER = 887220;
    uint128 internal constant SWAP_IN = 0.01 ether;
    uint128 internal constant SWAP_MIN_OUT = 9_700 ether;

    struct ExactInputSingleParams {
        PoolKey poolKey;
        bool zeroForOne;
        uint128 amountIn;
        uint128 amountOutMinimum;
        bytes hookData;
    }

    function key(address token) internal pure returns (PoolKey memory) {
        return PoolKey(address(0), token, 3000, 60, address(0));
    }

    function poolId(address token) internal pure returns (bytes32) {
        return keccak256(abi.encode(key(token)));
    }

    function seedCalls(address token, address owner, uint256 deadline) internal pure returns (bytes[] memory calls) {
        bytes[] memory params = new bytes[](3);
        params[0] = abi.encode(key(token), LOWER, UPPER, uint256(LIQUIDITY), MON_MAX, CHOMP_MAX, owner, bytes(""));
        params[1] = abi.encode(address(0), token);
        params[2] = abi.encode(address(0), owner);
        calls = new bytes[](2);
        calls[0] = abi.encodeCall(IPositionManager.initializePool, (key(token), SQRT_PRICE_X96));
        // MINT_POSITION, SETTLE_PAIR, SWEEP any unused native MON back to its owner.
        calls[1] = abi.encodeCall(IPositionManager.modifyLiquidities, (abi.encode(hex"020d14", params), deadline));
    }

    function swapInputs(address token, uint128 minimum) internal pure returns (bytes[] memory inputs) {
        bytes[] memory params = new bytes[](3);
        params[0] = abi.encode(ExactInputSingleParams(key(token), true, SWAP_IN, minimum, bytes("")));
        params[1] = abi.encode(address(0), uint256(SWAP_IN));
        params[2] = abi.encode(token, uint256(minimum));
        inputs = new bytes[](1);
        // SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE_ALL. Router command 0x10 is V4_SWAP.
        inputs[0] = abi.encode(hex"060c0f", params);
    }
}

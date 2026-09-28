// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {Chomp} from "../src/Chomp.sol";
import {LaunchConfig as C} from "../src/LaunchConfig.sol";
import {IPositionManager, IPermit2, IUniversalRouter, IStateView} from "../src/Interfaces.sol";

contract LaunchForkTest is Test {
    Chomp token;
    address wallet;
    uint256 positionId;

    function setUp() public {
        vm.createSelectFork("monad");
        wallet = makeAddr("liquidity-owner");
        vm.deal(wallet, 1 ether);
        vm.startPrank(wallet);
        token = new Chomp(wallet);
        assertEq(IPositionManager(C.POSITION_MANAGER).poolManager(), C.POOL_MANAGER);
        assertEq(IPositionManager(C.POSITION_MANAGER).permit2(), C.PERMIT2);
        token.approve(C.PERMIT2, C.CHOMP_MAX);
        IPermit2(C.PERMIT2).approve(address(token), C.POSITION_MANAGER, C.CHOMP_MAX, uint48(block.timestamp + 600));
        positionId = IPositionManager(C.POSITION_MANAGER).nextTokenId();
        IPositionManager(C.POSITION_MANAGER).multicall{value: C.MON_MAX}(
            C.seedCalls(address(token), wallet, block.timestamp + 600)
        );
        vm.stopPrank();
    }

    function testSeedSwapAndWithdraw() public {
        assertEq(IPositionManager(C.POSITION_MANAGER).ownerOf(positionId), wallet);
        assertEq(IPositionManager(C.POSITION_MANAGER).getPositionLiquidity(positionId), C.LIQUIDITY);
        assertEq(IStateView(C.STATE_VIEW).getLiquidity(C.poolId(address(token))), C.LIQUIDITY);
        assertGe(wallet.balance, 0.6 ether);
        uint256 beforeSwap = token.balanceOf(wallet);
        vm.prank(wallet);
        IUniversalRouter(C.ROUTER).execute{value: C.SWAP_IN}(
            hex"10", C.swapInputs(address(token), C.SWAP_MIN_OUT), block.timestamp + 600
        );
        assertGe(token.balanceOf(wallet) - beforeSwap, C.SWAP_MIN_OUT);
        assertEq(token.totalSupply(), 1_000_000_000 ether);

        // The NFT owner can exit directly through PositionManager, with no app server.
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(positionId, uint128(0.4 ether), uint128(380_000 ether), bytes(""));
        params[1] = abi.encode(address(0), address(token), wallet);
        vm.prank(wallet);
        IPositionManager(C.POSITION_MANAGER).modifyLiquidities(abi.encode(hex"0311", params), block.timestamp + 600);
        assertEq(IStateView(C.STATE_VIEW).getLiquidity(C.poolId(address(token))), 0);
        assertGe(wallet.balance, 1 ether - 2);
        assertApproxEqAbs(token.balanceOf(wallet), token.totalSupply(), 2);
    }

    function testSwapRejectsInsufficientOutput() public {
        vm.startPrank(wallet);
        vm.expectRevert();
        IUniversalRouter(C.ROUTER).execute{value: C.SWAP_IN}(
            hex"10", C.swapInputs(address(token), 10_000 ether), block.timestamp + 600
        );
        vm.stopPrank();
    }
}

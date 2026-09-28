# $CHOMP on Monad testnet

The Monad Pet token is a plain, fixed-supply ERC-20 deployed on Monad testnet (chain 10143). The source is in `src/Chomp.sol`; the constructor mints the full supply once to the deployer wallet and exposes no owner, mint, tax, blacklist, or pause controls.

## Token

- Name: Monad Pet Chomp
- Symbol: CHOMP
- Decimals: 18
- Total supply: 1,000,000,000 CHOMP
- Contract: [`0x130556848511554b181e645309754F265522F3c2`](https://testnet.monadvision.com/address/0x130556848511554b181e645309754F265522F3c2)
- Deployment transaction: [`0x6940277747e58367f70c3f9cb45c42f86241b63fc0ff257400c74167733670a4`](https://testnet.monadvision.com/tx/0x6940277747e58367f70c3f9cb45c42f86241b63fc0ff257400c74167733670a4)
- Deployer and initial holder: `0x2FC78182ec68efA8d402C51671Ae9497a524B96e`

## Uniswap v4 pool

The pool uses the Monad-maintained Uniswap v4 deployment:

- PoolManager: [`0x451D64ab3b650040d2aE1886602b97ed6eDc643d`](https://testnet.monadvision.com/address/0x451D64ab3b650040d2aE1886602b97ed6eDc643d)
- PositionManager: [`0x3Bb14E3D0Cd50aBe3EdACa06d06c29C78676C31A`](https://testnet.monadvision.com/address/0x3Bb14E3D0Cd50aBe3EdACa06d06c29C78676C31A)
- UniversalRouter: [`0x1b7bFCd2870329B987191910D85c22C7287f3c22`](https://testnet.monadvision.com/address/0x1b7bFCd2870329B987191910D85c22C7287f3c22)
- StateView: [`0xB639209539c61BaF67AC04876315786F8D0b153c`](https://testnet.monadvision.com/address/0xB639209539c61BaF67AC04876315786F8D0b153c)
- Pool key: currency0 = native MON, currency1 = CHOMP, fee `3000`, tick spacing `60`, hooks `address(0)`
- Pool ID: `0x19cd3dff7f181c5985342bac35613d71edbfbd8f37769750c17f7de6a6e2e543`
- Position NFT: token ID `13`, owned by the deployer wallet, full range `[-887220, 887220]`
- Initial price: 1 MON = 1,000,000 CHOMP
- Liquidity: 0.4 MON paired with approximately 400,000 CHOMP
- Pool initialization and liquidity transaction: [`0xc0a8426ece1fc66e99fc8e11f6623028c28e7d6e9f554317909f89b1d7adc6de`](https://testnet.monadvision.com/tx/0xc0a8426ece1fc66e99fc8e11f6623028c28e7d6e9f554317909f89b1d7adc6de)

## Test swap

A 0.01 MON exact-input swap was sent through the UniversalRouter with a 9,700 CHOMP minimum. It returned approximately 9,727.541039588262555796 CHOMP:

- Swap transaction: [`0x4f0ab131f81200dd7477a1ae9de0b3759ba3c6594231d9605e48cef5919cae08`](https://testnet.monadvision.com/tx/0x4f0ab131f81200dd7477a1ae9de0b3759ba3c6594231d9605e48cef5919cae08)

StateView verification after the swap reported nonzero pool liquidity (`400000000000000000000`) and the expected pool key. The fork tests in `test/LaunchFork.t.sol` cover initialization, full-range liquidity, the swap, position withdrawal, and a slippage-reverting swap.

## Reproduce checks

```bash
forge test --monad -vv
```

`script/Deploy.s.sol` deploys the token. `script/BuildCalldata.s.sol` builds the exact seed and swap calldata used above without embedding a private key.

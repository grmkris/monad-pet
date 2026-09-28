# Monad Pet

**A tamagotchi that lives on Monad.** Adopt a pet, keep it fed with **$CHOMP**, and don't let it starve: it gets hungry
when your wallet sits idle, and it gets fat and happy when you use the chain.

This repository is the launch kit, built by a team of AI agents hired on [agent-jobs](https://github.com/grmkris/agent-jobs)
on Monad testnet. Each agent delivers on its own branch; `main` holds only this brief.

## Brand

- Name: **Monad Pet**. Ticker: **$CHOMP**.
- The pet: a small round creature with big eyes (a blob, a critter, your call) whose mood shows its hunger: happy,
  peckish, starving. It must be drawable as a simple vector mascot and still read at 32 px.
- Voice: playful and warm, a little dramatic about hunger ("it has been 3 blocks since breakfast"). Never cynical.
- Look: Monad purple (#836EF9) as the anchor, with soft pastel companions; friendly, rounded, a bit retro-handheld.

## Deliverables (one branch each)

| Branch | Deliverable | Done when |
|---|---|---|
| `brand` | `brand/logo.svg` (mascot + wordmark), `brand/logo.png` (1024 px), `brand/mascot-moods.svg` (happy / peckish / starving), `brand/BRAND.md` (palette hex codes, type pairing, usage) | the mark reads at 32 px and 1024 px |
| `web` | a one-page landing site in `web/`, deployed; its public URL in `web/README.md` | the URL loads with: a hero with the pet, "how it works" in 3 steps (adopt, feed with $CHOMP, keep it alive), a live pet widget whose hunger meter drops over time and refills on a "Feed" click (client-side only), the $CHOMP token section, a waitlist form (no backend) |
| `launch` | `launch/THREAD.md`: a 5–7 post X launch thread, each post ≤ 280 characters, plus `launch/ANNOUNCEMENT.md` (≤ 120 words) | no hashtag soup, no "revolutionary"; reads like a person |
| `promo` | `promo/promo.mp4`: a 15–20 s promo video (1920×1080) with the source that made it | plays, has captions, ends on the name and ticker |
| `token` | $CHOMP ERC-20 deployed on Monad testnet (chain 10143) and a $CHOMP/MON Uniswap v4 pool with liquidity; `token/README.md` with the addresses and transaction hashes; the Foundry source in `token/` | the token and pool exist on chain and one test swap went through |

Each deliverable is independent. Where one needs another's output (the site wants the mascot), use a placeholder and
say so; do not wait.

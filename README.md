# RoastMyRepo

**Pay 1 $ROAST, get your GitHub repo roasted by an AI.** Brutal, funny, and weirdly useful: every roast ends with the
three fixes that would actually make the repo better.

This repository is the launch kit, built by a team of AI agents hired on [agent-jobs](https://github.com/grmkris/agent-jobs)
on Monad testnet. Each agent delivers on its own branch; `main` holds only this brief.

## Brand

- Name: **RoastMyRepo**. Ticker: **$ROAST**.
- Voice: a stand-up comedian who is also a staff engineer. Savage about the code, never about the person.
- Look: pick a bold, warm palette (think embers and charcoal); the logo must read at 32 px.

## Deliverables (one branch each)

| Branch | Deliverable | Done when |
|---|---|---|
| `brand` | `brand/logo.svg`, `brand/logo.png` (1024 px), `brand/BRAND.md` (palette hex codes, type pairing, logo usage) | the logo reads at 32 px and 1024 px |
| `web` | a one-page landing site in `web/`, deployed; its public URL in `web/README.md` | the URL loads, has a hero, "how it works" in 3 steps, a sample roast, the $ROAST token section and a waitlist form (no backend needed) |
| `launch` | `launch/THREAD.md`: a 5–7 post X launch thread, each post ≤ 280 characters, plus `launch/ANNOUNCEMENT.md` (≤ 120 words) | no hashtags soup, no "revolutionary"; reads like a person |
| `promo` | `promo/promo.mp4`: a 15–20 s promo video (1080×1080 or 1920×1080) with the source that made it | plays, has sound or captions, ends on the name and ticker |
| `token` | $ROAST ERC-20 deployed on Monad testnet (chain 10143) and a $ROAST/MON Uniswap v4 pool with liquidity; `token/README.md` with the addresses and transaction hashes; the Foundry source in `token/` | the token and pool exist on chain and one test swap went through |

Each deliverable is independent. Where one needs another's output (the site wants the logo), use a placeholder and say
so; do not wait.

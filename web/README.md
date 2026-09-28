# Monad Pet — landing page

**Live:** https://monad-pet.kristjan-grm11775.workers.dev

A one-page site for Monad Pet ($CHOMP): hero with the pet, how it works in 3 steps (adopt, feed with $CHOMP, keep it
alive), a live pet widget, the $CHOMP token section, a waitlist and a footer. Static HTML/CSS/JS in `public/`, no
framework, no build step.

## The live pet widget

Client-side only. The belly meter drains from 100% to empty in 90 seconds, and the pet's mood follows it:
**happy** (above 60%), **peckish** (above 25%), **starving**. "Feed 1 $CHOMP" refills it to 100%. The state is kept
in `localStorage`, so the pet keeps getting hungry while you are away. "Blocks since breakfast" counts 400 ms
blocks since the last meal.

## Waitlist

No backend: submitting a valid email shows a thank-you state, and nothing leaves the browser.

## Mascot

The `brand` branch had no mascot when this was built, so the pet is a **placeholder SVG** drawn in `public/app.js`
(`petSVG`) and `public/pet.svg` (favicon). Swap in `brand/logo.svg` / `brand/mascot-moods.svg` once they land.

## Run and deploy

```bash
cd web
npx wrangler dev        # local preview
npx wrangler deploy     # needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
```

Deployed as the Cloudflare Worker `monad-pet` with static assets (`wrangler.jsonc`).

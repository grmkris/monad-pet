# Monad Pet — promo video

**`promo.mp4`** — 18 s, 1920×1080, 30 fps, H.264 + AAC, ~7.6 MB. Captions are burned in, and the same captions ride
along as a soft English subtitle track (`mov_text`) and as [`promo.srt`](promo.srt).

| Time | Beat | Caption |
|---|---|---|
| 0–4.5 s | Meet the pet: it pops in, sparkles, blinks, hops, hearts | Meet your Monad Pet. |
| 4.5–9 s | Time passes: dusk falls, "blocks since breakfast" ticks 1-2-3, the tummy meter drains to red, the pet droops, sweats, grumbles; slow push-in | It's been 3 blocks since breakfast… / …and it's starving. |
| 9–13 s | A $CHOMP coin drops, CHOMP!, the lights come back, the meter refills, the counter resets to 0, the pet is delighted (and rounder) | Feed it $CHOMP. / Saved. Delighted. A little chubby. |
| 13–18 s | The pet leaps out; end card: mascot, **Monad Pet**, **$CHOMP**, "on Monad testnet" | Adopt yours. Keep it fed. |

Music: an original Lyria track cut to the beats (see [`src/assets/audio/MUSIC.md`](src/assets/audio/MUSIC.md)). No voiceover.

The mascot here is a placeholder drawn for this video (a round Monad-purple blob with big eyes, pastel companions),
following the brand notes in the main README; the `brand` branch owns the final mark. Swap the SVG in
`src/index.html` (`#pet-svg`, `#end-pet`) once it lands.

## Source

[`src/`](src) is the [HyperFrames](https://hyperframes.heygen.com) project that renders it: one composition,
`src/index.html` (HTML + GSAP, one paused timeline), with its fonts (Fredoka, Press Start 2P; OFL), GSAP and the
music bed vendored under `src/assets/` so a render needs no network.

```bash
cd promo/src
npx hyperframes@0.8.85 check                                   # lint + runtime + layout + contrast
npx hyperframes@0.8.85 render --quality looks --fps 30 --output renders/promo-raw.mp4
# add the soft caption track
ffmpeg -i renders/promo-raw.mp4 -i ../promo.srt -map 0:v -map 0:a -map 1:0 -c:v copy -c:a copy \
  -c:s mov_text -metadata:s:s:0 language=eng -disposition:s:0 0 -movflags +faststart ../promo.mp4
```

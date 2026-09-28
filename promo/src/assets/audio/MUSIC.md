# Music bed

`bgm.m4a` is an 18 s excerpt of one track generated with Lyria (`lyria-3.5`, Gemini API `generateContent`,
`responseModalities: ["AUDIO"]`). Prompt:

> A 20-second playful, warm chiptune / retro handheld-game instrumental for a cute virtual pet promo. 0-4s: bright
> bouncy intro, happy pet appears (major key, bubbly synth arpeggio, light percussion). 4-9s: tension - music slows and
> turns dramatic and a little comedic-sad, minor key, a slow descending bassline, like the pet is getting hungry.
> 9-13s: a joyful rescue, big uplifting major-key burst, sparkly chimes, happy chomping energy. 13-20s: triumphant,
> cheerful outro that resolves cleanly on a final chord and ends. No vocals, instrumental only, about 120 BPM.

The model returned 118 s (~117.5 BPM). The bed is cut to the story, on the beat grid:

- source 90.963–104.543 s → video 0–13.58 s (the track's breakdown lands on "hungry" at 4.5 s, the swell on the feed at ~9.2 s)
- 0.3 s crossfade into source 111.395–116.5 s (the track's own ending) under the end card
- loudness-normalised to −16 LUFS, 48 kHz AAC

```bash
ffmpeg -i lyria_raw.mp3 -filter_complex "\
[0:a]atrim=start=90.963:end=104.543,asetpts=PTS-STARTPTS[a];\
[0:a]atrim=start=111.395:end=116.5,asetpts=PTS-STARTPTS[b];\
[a][b]acrossfade=d=0.3:c1=tri:c2=tri,afade=t=in:d=0.15,apad=whole_dur=18,atrim=end=18,afade=t=out:st=17.5:d=0.5,loudnorm=I=-16:TP=-1.5:LRA=11[out]" \
  -map "[out]" -ar 48000 -c:a aac -b:a 160k bgm.m4a
```

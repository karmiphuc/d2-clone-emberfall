# v0.19 — Simple party walk loops

The hero repeats one 16-frame walk every 0.7 seconds; each mercenary repeats one 24-frame walk every 0.8 seconds. The same playback applies to equipment previews. Ground positions remain interpolated between simulation ticks.

Party walks no longer change banks, vary cadence with distance, reset when resuming, blend fractional silhouettes or crossfade while entering, leaving or turning. The walking sprite supplies its own body movement; the extra procedural bob is removed. Attack variations and gameplay clocks remain intact.

Local verification: 65 unit tests and seven focused browser tests passed. The strengthened six-role follow test also passed, checking constant frame progression, no fades, stable bank, turns, idle arrival and Hold. Formatting, production build and standalone packaging passed.

`party-loops-v0.19.json` records all six roles from controlled 30 Hz simulation / 60 Hz presentation captures. `screenshots/party-loops-v0.19.webm` shows those captures side by side with scenery hidden for inspection. These are software-rendered playback checks, not hardware performance benchmarks.

This release changes playback, using the existing original sprite artwork. It retains four facing directions and the existing baked intermediate frames; it does not claim new character anatomy or higher-resolution artwork.

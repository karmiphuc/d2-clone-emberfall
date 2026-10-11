# v0.23 — Combat sound and a quieter HUD

Enemy labels and the creature panel now show identity and health without attack timing bars, amber attack outlines or strike/recovery instructions. Conditions remain only when meaningful: Enraged, Armored, Chilled or Challenged. Hover inspection still preserves attack selection. Boss anticipation and direction remain visible through the approved animation and small ground tell; hero skill cooldowns remain unchanged.

## Sound

Sound starts only after clicking **Sound: Off**, including on phones. The button exposes On/Off and an accessible pressed state. Muting stops transient voices before suspending audio; resuming preserves the wind loop without replaying interrupted hits.

Original Web Audio synthesis now distinguishes light/heavy weapon swishes, bow strings, frost/holy/hostile projectile release, layered physical impact, magical impact, Guard, delivered healing and normal/boss death. Release and contact have independent throttles; a volley has one release sound. A stereo mix fades with distance, limits itself to 24 transient voices, compresses overlapping peaks and disconnects ended nodes. No downloaded sound assets or character voices were added.

The [six-second audio reference](screenshots/combat-audio-v0.23.wav) renders these cues through real OfflineAudioContext nodes. Its [schedule and measurements](combat-audio-v0.23.json) record light strike/contact, heavy Cleave/contact, Guard, arrow/contact, frost/contact, healing and boss strike/contact/death. The reference peaks below clipping; it is an isolated synthesis reference, not a recording of an actual battle. Headphone/loudspeaker preference remains a player judgment.

## Effects and verification

Brief directional slashes now aim using the camera projection. Smaller contact, elemental and healing marks leave bodies, hands and weapons readable. Projectile timing and the approved actor atlases are unchanged. Existing softened effects/reduced motion still reduce flashes, recoil and effect opacity.

- [Runtime reel](screenshots/combat-presentation-v0.23.webm), [trace](combat-presentation-v0.23.json) and [normal-scale screenshot](screenshots/combat-presentation-v0.23.png): 105 frames at 30 fps, staging Mournfang and an Embercaller with the level-five party. Inspect anticipation, sidestep, re-engagement, contact and enrage with the simplified panel. Bram's taunt is held on cooldown to isolate the hero-facing dodge. This capture is presentation evidence, not a hardware performance benchmark.
- [Phone sound control](screenshots/combat-sound-mobile-v0.23.png): 390 × 844, visible enabled sound control and no horizontal page overflow.
- Unit coverage checks release/arrival separation, volley deduplication, silent suspended/distant events, mute clearing, bounded voices and ended-node cleanup, plus existing gameplay/contact/save tests.
- Browser coverage checks real AudioContext activation, suspend/resume and immediate clearing, target inspection/health, absence of timing bars, phone layout, committed boss sidestep, fresh respawn rewards and keyboard/pointer/touch recovery exits.

The GitHub release workflow runs the full unit/browser suite and production build before publishing Pages.

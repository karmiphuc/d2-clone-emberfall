# v0.16 continuous movement and attack playback

Scope: runtime continuity, rather than additional animation artwork. [Previous review](qa-v0.15.md).

## Findings and fixes

The v0.15 exposure/alpha checks did not catch discontinuities in live waypoint and clip-boundary playback.

1. **P1, fixed — idle flashes while moving through path nodes.** A tick that reached a waypoint moved the character but left `moving` false and discarded its remaining travel budget. The runtime trace repeatedly alternated idle/walk while the hero advanced. `stepWaypoints` now consumes the complete budget across short nodes, preserves bend traversal and marks every tick with actual travel as moving, including arrival. The captured 72-frame route stays on walk for every moving frame.
2. **P1, fixed — attack recovery samples the wrong atlas.** Physics could choose the walking texture while the interpolated render clock still selected attack row 31. That row is outside the 16-row walking atlas. Clip, atlas and frame sampling now share the render clock. Browser coverage verifies attack entry and recovery at five interpolation positions.
3. **P1, fixed — fades temporarily quantize playback.** Transitions previously held whole frames before jumping back into fractional playback. Both outgoing and advancing incoming poses now preserve their neighboring frames and fractional mix through a 90 ms fade. Transparent actor materials avoid writing depth through soft silhouette fragments.
4. **P2, fixed — gait restarts and variant seams rewind.** Fresh gait starts reset both current and previous clocks; displayed stride phase controls when the new walk bank becomes visible. Attack starts likewise initialize both clocks to prevent reverse entry interpolation.
5. **P3, remaining — underlying artwork quality.** Existing inferred intermediate poses can soften or separate weapon edges around occlusions, especially in enlarged previews. These runtime fixes do not replace the original or inferred anatomy. Software WebGL captures do not establish sustained hardware FPS.

## Evidence

[Walking sequence](screenshots/walk-continuity-v0.16.webp) and [three attack sets](screenshots/attack-continuity-v0.16.webp) sample actual 30 Hz world updates presented at 60 Hz. [Walk recording](screenshots/walk-continuity-v0.16.webm), [attack recording](screenshots/attack-continuity-v0.16.webm) and the [before/after waypoint trace](waypoint-continuity-v0.16.json) are retained with this review. Full local frame sequences remain in `/workspace/emberfall-design/v16-review`. This is controlled temporal playback, not a hardware performance benchmark.

## Verification

56 unit tests and all 23 browser tests passed (79 total). Nine focused browser checks also passed before the full run. Production checks passed: mercenary gear persists through reload, the phone UI fits, hero attack atlas dimensions are correct and automatic attacks defeat a Blood Moor enemy without target clicks. No console errors or missing assets. The [phone preview](screenshots/phone-preview-v0.16.webp) also passed without overflow. The standalone browser check passed the same equipment, phone and automatic-combat checks with no external game-image requests. Publication is verified against the public bundle after the GitHub workflow completes. Production build and single-file packaging passed; package size is 31,119,189 bytes.

Published v0.16: workflow 38044561107 passed verification, Pages and release jobs; live mercenary persistence, phone UI and automatic Blood Moor combat passed.

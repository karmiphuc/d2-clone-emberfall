# v0.14 sprite cadence and attack progression

Scope: movement and attack presentation in the camp, Blood Moor and Den. [Previous review](docs/qa-v0.13.md).

## Evidence

Recorded the v0.13 movement/combat baseline before changing code. Opened new pose artwork, rejected repeated-leg gait sheets, inspected intermediate-frame contact sheets, then recorded the revised runtime. Local Chromium/Playwright supplies evidence; cloud browser tools are unavailable.

Accepted runtime evidence: [walk progression](docs/screenshots/walk-sequence-v0.14.webp), [attack progression](docs/screenshots/attack-sequence-v0.14.webp), [camp movement](docs/screenshots/camp-walk-v0.14.webp), [normal combat](docs/screenshots/combat-v0.14.webp), [phone preview](docs/screenshots/phone-preview-v0.14.webp). Full recordings and captures remain in `/workspace/emberfall-design/v14-before`, `v14-assets` and `v14-review`.

## Findings and changes

1. **P1, improved — two underlying walk poses still feel like rocking.** Hero sword/axe movement now includes new passing-step artwork between the contact poses. Sixteen baked frames per facing form each character/creature gait. Sampling adjacent frames keeps playback continuous at higher display rates; distance controls cadence. Companion walks still derive from their limited original key poses.
2. **P1, improved — attacks lack a visible progressing downstroke and recovery.** Added original hero downstroke and follow-through poses, then baked 33 frames across preparation, coil, downstroke, contact, follow-through, recovery and standing guard. Frame 12 shares the contact event. The hero's deliberate contact freeze is removed. Companions/monsters use 17-frame release/recovery sequences, preserving their existing action clocks.
3. **P2, improved — intermediate silhouettes cost shader work and can ghost.** The player no longer fetches flow fields or performs multi-sample displacement per pixel. Intermediate frames are generated offline and committed as WebP atlases. The shader blends adjacent close frames and short clip/facing transitions. The first DIS bake showed double-image weapon edges and was rejected; the accepted bake uses offline RIFE interpolation with additional hero key poses. Occluded weapon edges can still soften in some intermediate frames.
4. **P2, improved — high pixel density can consume the frame budget.** Scene resolution now lowers gradually after sustained slow frames and restores detail more slowly after sustained fast frames. The default cap is 1.25, minimum 0.65; UI keeps native CSS resolution. Direct renderer overrides remain respected. Selection rings follow interpolated roots. Character previews cap pixel ratio at 1.25.
5. **P3, remaining — authored anatomy and directional coverage are limited.** Frame counts are playback frames, not claims of 16/33 independently authored poses. Companion gaits, rear-facing strikes, four-direction turns and reused death art still limit fidelity. The baked cells prioritize detail at normal game scale; enlarged previews expose softness more clearly.

## Verification

47 unit tests passed, including monotonically progressing 33-frame hero playback, exact contact frame, continuous loop boundaries and bounded/adaptive pixel resolution. Seven focused browser tests passed for longer movement sequences, hero swing progression without resets, contact/damage alignment, cancellation, automatic attacks/retreat, all six companion roles and silhouette picking. Runtime captures have no console errors or phone overflow.

Build/package passed. The standalone package is 31,908,989 bytes, smaller than v0.13's package despite longer sequences because old motion atlases and the vector binary are no longer referenced by the player. The full regression passed: 47 unit tests and 20 browser tests (67 total). Production and standalone browser checks passed through normal controls: mercenary weapon/armor ownership survives reload, phone UI fits, and the solo hero defeats an enemy automatically in Blood Moor without target clicks. No console errors or missing assets; the standalone requests no external game images. Deployment is checked after publication.

Headless Chromium uses software WebGL here. Baseline and fixed-ratio captures were both near 100 ms between render callbacks; this environment does not establish a 60 fps hardware guarantee. More sprite frames and adaptive resolution address separate causes of perceived stutter.

final result: v0.14 published; GitHub workflow 38031311759 passed all three jobs and public browser checks passed. Hardware playtesting remains necessary to assess sustained frame rate.

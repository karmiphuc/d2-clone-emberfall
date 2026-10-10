# v0.12 motion and contact review

Scope: movement and combat presentation in the existing camp, Blood Moor and Den. [Previous review](docs/qa-v0.11.md). No new campaign area or system.

## Evidence and visual target

Retained the original painted characters, muted dusk palette and stone/bronze HUD. Applied the Product Design workflow to the existing visual target. Local Playwright/Chromium captured the baseline, recorded the revised game and captured exact sword/axe phases; cloud browser tools are unavailable. Opened the new atlases, desktop/phone captures and temporal contact sheets before accepting the changes.

Evidence: [normal combat](docs/screenshots/combat-v0.12.webp), [idle through attack recovery, sword and axe](docs/screenshots/attack-phases-v0.12.webp). Full before/after recordings and frame sequences are retained under `/workspace/emberfall-design/v12-before-video` and `/workspace/emberfall-design/v12-review`.

## Findings and resolutions

1. **P1, improved — damage arrives before a readable hero swing.** Six painted attack phases now accompany a simulation windup: 160 ms basic / 220 ms Cleave. Contact emits the cut, sound, damage and mana cost together. Moving or losing the target/range cancels anticipation. Camp practice effects follow the same windup. Recovery finishes before the next basic swing.
2. **P2, improved — moving figures alternate between walk and idle art; monsters slide.** Walking no longer inserts idle frames. Phase follows distance traveled rather than elapsed time. Fallen, Risen and Brutes have four-phase gaits, with separate stride lengths. Facing hysteresis reduces flicker near quadrant boundaries. Companions plant their feet during attack recovery.
3. **P2, improved — hits lack weight and deaths topple like flat cards.** Added restrained directional recoil and a short visual contact hold without pausing gameplay clocks. Deaths settle slightly into the ground and fade after a short delay. Reduced effects suppresses new recoil, holds and flashes.
4. **P2, remaining — hero/companion walks still have only two poses.** Longer generated hero sheets repeatedly failed left/right foot alternation. Rejected them instead of increasing frame count with inconsistent art. The accepted changes improve timing; they do not constitute a finished walk-animation overhaul.
5. **P3, remaining — four facings and limited death animation.** Turning is still discrete. Monsters retain two attack poses. Deaths reuse the standing artwork; authored collapse frames, eight directions and longer companion cycles are future work.

## Fidelity surfaces

- Typography, UI spacing, controls and content retain the existing layout; the phone capture has no horizontal overflow.
- Colors retain painted leather/metal, muted red cloth, cool earth and warm restrained impact light.
- New transparent sword/axe attack and creature gait atlases preserve identity and foot baselines. No extracted Diablo assets.
- Runtime phase captures show a readable coil, cut and recovery at normal character size. The rear-facing swing remains less expressive than the front-facing cut.

## Verification

Focused browser checks passed for all six sword/axe attack phases, exact contact/damage timing, cancellation, held recovery, effects cleanup and action feedback. Unit coverage passes for windup, range/target loss, gait distance, impact holds and facing hysteresis.

Full regression passed: 35 unit tests and 16 browser tests (51 total), including four hunts to level six, equipment/talent persistence, all six companion roles and a complete Den clear. Build/package, formatting and diff checks passed.

The production build traversed camp → Moor → Den → Moor → camp using normal controls, then reloaded successfully. Desktop/phone checks found no page errors, missing assets or horizontal overflow, and no development hook. New motion artwork loaded successfully. The standalone HTML (29,644,817 bytes) trained a talent without external image requests. Public deployment is verified after publishing.

final result: passed for this scoped update; longer hero/companion walks remain open

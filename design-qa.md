# v0.13 continuous motion, automatic attacks and mercenary gear

Scope: existing camp, Blood Moor and Den. [Previous review](docs/qa-v0.12.md).

## Evidence

Retained the painted characters, muted earth palette and stone/bronze UI. Captured the old movement and combat before editing, then recorded the revised runtime and opened desktop, phone, automatic-combat and fractional-stride captures. Local Chromium/Playwright supplies browser evidence; cloud browser tools are unavailable.

Accepted captures: [fractional stride poses](docs/screenshots/stride-sheet-v0.13.webp), [mercenary equipment](docs/screenshots/merc-equipped-v0.13.webp), [phone equipment](docs/screenshots/merc-phone-v0.13.webp), [automatic combat](docs/screenshots/auto-combat-v0.13.webp). Full recordings and frame sequences remain under `/workspace/emberfall-design/v13-baseline`, `v13-before` and `v13-final-review`.

## Findings and resolutions

1. **P1, improved — positions jump at the 30 Hz gameplay rate.** Actor roots, posture, gait, swing progress, labels and combat effects now interpolate on rendering frames. The camera follows the displayed hero position. Gameplay contact timing remains fixed. Static environment shadows are cached rather than recomputed every frame.
2. **P1, improved — painted poses snap during walking and attacks.** Numerical bidirectional optical-flow fields deform adjacent poses toward intermediate silhouettes. Short eased transitions cover changes of clip and facing; a fixed sprite quad avoids size jumps. Premultiplied-alpha blends avoid dark fringes. The fields derive from the original atlases; they do not replace the illustrations.
3. **P1, resolved — hero waits for clicks while nearby creatures attack.** An idle hero acquires living, visible, in-range threats and attacks repeatedly, selecting another nearby foe after a kill. Incoming hits can trigger retaliation. Manual movement cancels anticipation and has priority. Automatic attacks do not chase distant enemies or reach through dungeon walls. Camp remains peaceful.
4. **P1, resolved — mercenaries cannot use collected gear.** A portrait click opens that mercenary's equipment. The shared backpack includes an owner selector, four slots, live stats, comparison, role/level restrictions and Remove controls. All six mercenaries retain their equipment through dismissal, recruitment and reload. Damage, life, armor, mana-related casting speed and healer bonuses affect combat. Eight class weapons are available from Charsi and loot.
5. **P3, remaining — source animation and equipment silhouettes are limited.** Hero and companion walks still derive from two painted key poses. Optical flow improves continuity but can soften fine edges during large weapon changes. Four facings and reused standing death art remain. Mercenary illustrations retain their class weapon silhouette; enchanted equipment adds an accent, but each item does not yet have its own authored character frame. These are asset limitations, not a claim of finished animation fidelity.

## Fidelity and usability

The owner selector, stats and equipment controls use existing bronze borders, dark surfaces and readable labels. Armor and class weapons have distinct inventory icons. At 390 pixels wide the dialog fits without horizontal overflow; its shared backpack scrolls vertically. Equipped items can be removed without losing them when the bag is full. Reserve mercenaries can be equipped in camp. Existing saves migrate to empty mercenary gear slots.

## Verification

Focused browser checks passed for interpolated actor positions and intermediate flow samples, automatic attacks and responsive retreat, visible-body picking and transparent margins, bounded combat effects, four hunts to level six, skill trees and all six companion roles. Mercenary UI checks cover role restrictions, real stats, removal, mobile layout and dismissal/reload.

Full regression passed: 44 unit tests and 19 browser tests (63 total), including repeat hunts to level six and a complete Den clear. Build/package, formatting and diff checks passed. The production build equipped a reserve mercenary, checked the phone layout, reloaded ownership, entered the Moor through normal controls and defeated a Fallen without enemy selection. There were no console errors, missing assets, horizontal overflow or development hook.

The standalone package is 32,266,738 bytes and includes the motion vector binary. It passed mercenary equipment/reload and automatic combat through normal controls. A separate asset check passed with optional Google fonts blocked: no external game image/vector requests or console errors, and working walk/attack previews. The initial strict resource check caught optional web-font requests and the local server favicon; it did not expose a gameplay failure. Public deployment checks follow publication. Headless Chromium uses software WebGL in this environment; this review does not establish a 60 fps hardware performance guarantee.

final result: passed for this scoped update; authored animation and item silhouettes remain limited

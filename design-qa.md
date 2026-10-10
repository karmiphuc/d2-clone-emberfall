# v0.9 companion combat review

Scope: readable companion attacks and ranged spellwork in the existing camp/Blood Moor slice. The [v0.8 review](docs/qa-v0.8.md) records the preceding atmosphere and targeting pass. This is an incremental release; full Act I and complete Diablo II fidelity remain unfinished.

## Visual target and evidence

The established Wrought Iron direction and existing companion idle/walk atlases are the visual references. New original attack artwork preserves each character's costume, palette, four facings and ground baseline. Both attack atlases and the projectile atlas were opened and inspected before review.

- [Matching before/after pose comparison](docs/screenshots/companion-comparison-v0.9.webp), two 1440 × 900 captures with identical camera, actor positions and strike state. This deliberately stages all six companions together for art inspection; the playable party remains one hero plus three companions.
- [Final companion poses](docs/screenshots/companion-poses-v0.9.webp).
- [Archer, tank and healer combat](docs/screenshots/combat-a-v0.9.webp), [mage, paladin and assassin combat](docs/screenshots/combat-b-v0.9.webp), and [phone combat](docs/screenshots/combat-mobile-v0.9.webp).

The combat captures stage positions and advance a real simulation attack, then pause through the inventory for inspection. The second party is recruited through the ordinary party controls. These are development inspection captures, not claims of an unstaged playthrough. The separate production check uses the camp gate, enters Blood Moor and queues a right-click skill without development hooks. Local Playwright/Chromium provides browser verification; the cloud browser connector remains unavailable.

## Findings and resolutions

1. **P2, resolved — companions lean instead of performing their roles.** Added 48 original directional frames: release/strike and recovery for each role. Bow, mace, staff, sword and paired daggers now create distinct silhouettes. Pair-specific scale adjustments preserve body size and foot alignment. Removed the generic attack wobble.
2. **P2, resolved — ranged attacks read as generic sparks.** Arrows, frost lances, divine bolts and healing motes use a dedicated illustrated atlas and rotate tip-first along their camera-space travel direction. The existing 64-effect cap and retreat cleanup remain.
3. **P2, resolved — a healing gesture can immediately face an enemy.** Eira previously healed and attacked in the same simulation action. Healing now consumes her action cooldown, keeps her facing the wounded ally and produces a visible cast plus recipient effect. A simulation test checks this priority.
4. **P2, resolved — stationary enemies can anticipate in the wrong direction.** Windup events now identify the intended victim and turn the enemy before its strike. Stable authored poses replace the shaking idle treatment.
5. **P3 — cycles remain brief.** Each companion attack has two authored poses. Ilyra's release reads as an immediate loose/aim moment rather than a long follow-through. Longer cycles and eight facings remain future work.

No unresolved P0/P1/P2 issues remain within this release's scope.

## Fidelity surfaces

- **Typography and spacing:** established HUD and panel typography/layout are retained; attack art fits within its atlas cells and keeps the existing actor footprints.
- **Colors and imagery:** moss/leather archer, iron tank, ivory healer, blue mage, gold paladin and burgundy assassin remain distinct. Frost, healing and holy effects use restrained matching colors. Complete weapons and transparent margins were inspected.
- **Copy and interaction:** controls are unchanged. Companion actions correspond to actual simulation events; healing takes priority over Eira's basic attack. Projectiles are visual feedback for the existing immediate ranged damage model, not new collision-based missiles.
- **Responsive behavior:** 1440 × 900 and 390 × 844 captures retain the established HUD. The short entry toast is visible in staged phone combat; final production checks include overflow detection.

## Verification

- 27 unit tests and all 12 browser tests passed: real attacks from all six companions, correct release/recovery maps, role projectile types, healing recipient/caster, held recovery, effect bounds/cleanup, targeting, equipment/save agreement, full expedition rewards, and four hunts to level 6 with talent changes.
- Production build and standalone packaging passed. Production/standalone browser validation and deployment are recorded in the release verification below.
- Original atlases are local assets, share cached image sources, and dispose cloned actor textures through the existing lifecycle. No save-schema change is introduced.

## Release verification

The final production browser flow reached Blood Moor through the camp gate and queued right-click Cleave. [Desktop](docs/screenshots/target-release-v0.9.webp) and [phone](docs/screenshots/mobile-release-v0.9.webp) captures were opened and inspected. Production and standalone runs reported zero page errors, missing assets or horizontal overflow; standalone made zero external image requests. Production exposes no development hook. Build, packaging, formatting and diff checks passed. GitHub deployment is checked separately after pushing this review.

final result: passed

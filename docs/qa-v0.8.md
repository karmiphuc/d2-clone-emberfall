# v0.8 atmosphere and targeting review

Scope: camp/Moor atmosphere, grounded characters, direct skill targeting and readable target feedback. The [v0.7 review](docs/qa-v0.7.md) links earlier combat-art and interface reviews. This accepts this incremental release, not complete Diablo II fidelity or a finished Act I.

## Visual source and evidence

The established Wrought Iron concept guides the cooler dusk/warm-hearth contrast. New original source images were opened before integration: stony camp albedo (`/workspace/generated_images/exec-0d794d41-256c-4e89-9395-d937ace6421a.png`) and soft contact shadow (`/workspace/generated_images/exec-88a0255d-d40e-401c-9581-30816527cca1.png`). Existing original earth, cobble and scenery artwork remains in use.

- [Camp comparison](docs/screenshots/camp-comparison-v0.8.webp): before and after at 1440 × 900, fresh camp and matching camera. Cooler stony terrain separates firelight from ambient dusk; illustrated cobbles replace the angular path stones.
- [Moor comparison](docs/screenshots/moor-comparison-v0.8.webp): same staged first-area camera and hero position, before/after. The Moor now has its own repeating terrain rather than the camp's painted paths.
- [Production camp](docs/screenshots/camp-v0.8.webp), [Moor](docs/screenshots/moor-v0.8.webp), [production target state](docs/screenshots/targeting-v0.8.webp).
- [Corrected mobile target state](docs/screenshots/targeting-mobile-v0.8.webp), 390 × 844: target health fits beside the party, the enemy label stays inside the viewport, and queued Cleave remains visible on the action bar.

Both combined comparisons and final captures were opened and inspected. Moor comparison staging uses the development hook; the production capture activates the ordinary gate service, waits for navigation, enters via its dialog and right-clicks an enemy label. The full scene was paused through inventory for capture. Production contains no debug hook. Local Playwright/Chromium provided browser verification because the cloud browser connector was unavailable.

## Findings and fixes

1. **P2, resolved — uniform warm ground across both areas.** Camp and Moor shared the same composited ground image, including camp path marks. They now use distinct surfaces and zone-specific lighting. Warm camp point lights remain visible against cooler ambient illumination.
2. **P2, resolved — first Moor lighting pass hides terrain detail.** The initial cool capture (`v08-moor-first.png`) made the ground nearly black. Raised the ground material's brightness while preserving the cooler light palette. The second/final capture restores readable ground texture and road edges.
3. **P2, resolved — invisible sprite margins intercept movement.** Default sprite raycasts hit the full rectangle around a figure. Picking now tests alpha in the current directional/animation cell, ignores shadow meshes and dead actors, and preserves ground movement through transparent margins. The real mouse test exercises an opaque body point and a transparent corner.
4. **P2, resolved — direct skill targeting lacks approach behavior.** Right-clicking a silhouette or label now stores a targeted Cleave intent, approaches into range and executes once. It rechecks target life/range/mana and cancels on movement, normal retargeting, restoration or target death.
5. **P2, resolved — mobile target health overlaps the party.** The first production phone capture placed selected-target health over the hero portrait. Moved it into the open right side, clamped visible enemy labels away from screen edges and hid labels outside the horizontal view. The final mobile capture verifies the correction.
6. **P3, improved — figures lack ground contact.** Original soft shadow decals now sit beneath actors and fade with enemy defeat transitions. They do not intercept picking or change navigation.

No unresolved P0/P1/P2 issues remain within this release's scope.

## Required fidelity surfaces

- **Typography:** existing classical headings and compact readable labels remain. Target health and action intent use the established hierarchy.
- **Spacing/layout:** desktop target information retains its location; mobile uses the space to the right of the party. The extra right-click hint is hidden on narrow screens, where the action button remains available.
- **Colors/tokens:** cool gray camp ground, warm hearth/forge pools and dark green Moor terrain distinguish safe and hostile spaces. Gold hover/selection labels and a restrained ground marker clarify the current target.
- **Image quality:** original terrain, cobbles and alpha shadow artwork replace prominent placeholders. Shadows, atlas masks and materials preserve the existing directional figures. Terrain remains planar and some smaller props remain simplified geometry.
- **Copy/content:** Help and the desktop control hint explain right-click Cleave. Queued intent and mana use follow actual simulation state; no additional skill or campaign content is implied.

## Verification

- **25 unit tests and all 11 browser tests passed.** Coverage includes targeted approach/charging/cancellation, silhouette picking, real right-click input, town navigation, equipment/save persistence, effects, defeat, full expedition rewards and four hunts to level 6 with all companion roles.
- The focused targeting browser test passed again after the final mobile-label correction.
- Production flow reached the Moor through the camp gate service and queued Cleave through an enemy label. Final desktop/mobile captures have no page errors, missing assets or horizontal overflow.
- Standalone HTML rendered the new art with zero external image requests. Production debug hooks are absent. Build, packaging and formatting passed.
- Alpha masks are cached with a longest side of 512 pixels; shadow materials/textures are disposed with replaced enemies and previews. Hardware performance remains a separate playtest concern.

## Follow-up

- Longer character cycles, more varied enemy attacks, and further lighting/prop cohesion.
- Hover feedback currently updates on pointer movement; a target moving under a stationary pointer can retain its prior hover until the pointer moves.
- Den of Evil and the remaining Act I campaign remain unimplemented.

final result: passed

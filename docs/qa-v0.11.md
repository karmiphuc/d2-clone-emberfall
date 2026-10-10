# v0.11 connected dungeon review

Scope: an authored Den of Evil connected to the existing Blood Moor. [Previous review](docs/qa-v0.10.md). The rest of Act I is unfinished.

## Evidence and visual target

The existing Wrought Iron camp/HUD, painted characters and combat effects remain the reference. New original cave artwork uses the same muted, textured isometric direction. The transparent 2×2 cave atlas was opened and inspected before integration. It contains a limestone wall, entrance, ritual altar and stalagmite/bone cluster.

Local Playwright/Chromium supplies browser screenshots; the cloud browser connector remains unavailable. The initial clear-test screenshot exposed an overly dark floor and repetitive reused Moor rubble. Subsequent desktop, phone and journal captures were opened and inspected after replacing that art and increasing cave fill lighting.

## Findings and resolutions

1. **P2, resolved — first cave looks like repeated rubble in a black void.** Added original cave walls, entrance, altar and stalagmites. Raised floor/ambient illumination while retaining dark rock outside the traversable footprint and warm torch pools.
2. **P2, resolved — hostile-area controls and labels assume the Moor.** Both hostile areas now display enemy/loot labels, action feedback, attacks and retreat. The cave has its own title, objective and minimap footprint; entrance/exit labels support normal approach and nearby E interaction.
3. **P2, resolved — attacks could cross dungeon walls.** Dungeon melee/cleave and ranged attacks require clear line of sight. Engaged enemies use the shared route function around blocked passages. Hero and companion movement use the existing clearance-aware A\*.
4. **P2, resolved — shared encounter progress would mix two areas.** Added validated dungeon-local kills, drops and a one-time reward. Area switching preserves party life/mana; camp restores them. Moor hunt resets leave the dungeon untouched.
5. **P3 — authored wall segments repeat.** The three chambers use a limited original prop kit and a fixed layout. Further shape/prop variety and procedural generation remain future work. The Gravewarden reuses the existing elite creature artwork.

## Fidelity surfaces

- **Typography:** existing classical location/dialog headings and readable body text; short cave subtitle fits phone widths.
- **Spacing/layout:** existing desktop/phone HUD; dungeon journal fits a 390 × 844 viewport without horizontal overflow.
- **Colors/tokens:** cool grey limestone, dark earth and warm torchlight; shared bronze UI controls.
- **Image quality:** original transparent cave illustrations, existing directional characters and pooled combat effects; no extracted Diablo assets.
- **Copy/content:** dungeon enemy count, clear objective, recommended level, retreat persistence, reward and claimed state are explicit.

## Verification

Focused end-to-end play passed: approach the cave from the Moor, clear all 11 enemies, retreat/reload before collecting all loot, return to collect it, exit through the cave mouth, claim the Akara bounty and reject a duplicate claim. Unit coverage verifies old-save defaults, invalid progress rejection, area isolation, retained party vitals and attacks blocked by a wall.

Full regression passed: 31 unit tests and 15 browser tests (46 total). After tightening queued Cleave across walls and dungeon drop validation, all unit tests and the dungeon/targeting browser checks passed again. A production check used a compatible level-three old-save fixture and normal controls to walk camp → Moor → Den → Moor → camp, inspect the journal on desktop/phone, and confirm dungeon entry persisted after reload. No page errors, missing assets or horizontal overflow were observed; the development hook is absent. The standalone build trained a talent with zero external image requests. Build/package, formatting and diff checks passed. Deployment is verified separately after publishing.

Final production evidence: [dungeon entrance](docs/screenshots/den-v0.11.webp), [phone journal](docs/screenshots/den-journal-mobile-v0.11.webp). Both were opened and inspected.

final result: passed

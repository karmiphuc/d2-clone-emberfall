# v0.4 character and interface review

Scope: the latest character-appearance correction, classic interface, and preservation of the playable first area. This is not acceptance of a complete Diablo II clone or finished Act I. The environment remains visibly simpler than the concept: tents, rocks, fences and terrain detail still need a separate environment-art pass. Full character animation also remains unfinished.

## Visual evidence

- Source visual truth: generated Wrought Iron concept, `/workspace/generated_images/exec-a7beda27-92b6-4531-b36c-47df6e086183.png`, 1586 × 992 pixels.
- Implementation: Chromium screenshots of the production build at 1440 × 900 CSS pixels, device scale factor 1. Source normalized to 1440 × 900; its aspect ratio is effectively identical. Inventory state: camp, worn sword equipped, iron axe selected, +3 damage comparison.
- [Full comparison](docs/screenshots/design-comparison.webp): concept left, implementation right, combined 2880 × 900 image.
- [Focused inventory comparison](docs/screenshots/inventory-comparison.webp): equal 570 × 900 crops, combined 1140 × 900 image. This supplements the full view because item labels are too small there.
- [Camp](docs/screenshots/camp-v0.4.webp), [inventory](docs/screenshots/inventory-v0.4.webp), [skills](docs/screenshots/skills-v0.4.webp), [Blood Moor](docs/screenshots/moor-v0.4.webp).
- [Mobile post-fix capture](docs/screenshots/mobile-v0.4.webp): 390 × 844 CSS pixels at scale 1; directional preview open. No horizontal overflow, clipped figure, or inaccessible close control.
- Browser captures: `/workspace/emberfall-design/*-release.png`. The production build has no development debug hooks. Blood Moor staging used the development hook to position the hero near the first encounter; gameplay was separately exercised by end-to-end tests.

## Findings and comparison history

1. **P1, resolved — primitive humanoids.** Earlier `camp-verified.png` and `inventory-verified.png` showed block-built figures, unlike the concept's detailed armor and anatomy. Replaced them with original transparent directional sprites for the hero, six companion roles, three named NPCs and three monster types. Seven equipment portraits replace the inventory mannequin. Post-fix evidence: camp, inventory and Moor captures above.
2. **P2, resolved — uneven companion scale.** Initial `camp-sprites.png` showed Ilyra, Bram and Eira smaller than the hero and reserve roles. Normalized the atlas figures to 430 pixels tall in 512-pixel cells with a common 94% foot baseline. The release camp capture shows consistent party scale.
3. **P2, resolved — mobile preview clipping.** The first mobile release capture clipped the turntable figure's head and weapon. The preview now fits its camera distance to the narrower dimension and centers the full figure. Recaptured mobile view confirms complete head, feet, shield and blade. Both equipment/mobile browser tests passed again after this fix.
4. **P2, resolved — equipment preview ambiguity.** Equipping a selected item previously made the preview automatically select the old weapon returned to the backpack. An explicit equipped-selection state now keeps the newly equipped item visible. Browser verification confirmed the axe portrait, equipped slot, saved item and in-world axe row agree after equipping and reload.

No unresolved P0/P1/P2 findings remain within the character/interface correction scope. Overall scene fidelity is not being certified by this review.

## Required fidelity surfaces

- **Typography:** Cinzel display headings retain the concept's classical serif hierarchy; Inter handles small instructions, stats and buttons. Georgia/Arial provide offline fallbacks. Titles, item names, requirements and primary actions remain readable without truncation in the checked views.
- **Spacing/layout:** the right inventory panel preserves the concept's character/slots, comparison/action, backpack hierarchy. Its height adapts to actual inventory content. Four equipped slots and six combat actions reflect implemented systems rather than adding nonfunctional slots from the concept. Mobile uses the available width without overflow; dialogs scroll when needed.
- **Colors/tokens:** black stone, muted brass outlines, parchment text, oxblood primary actions, red life and blue mana. Item rarity and positive/negative comparisons use semantic colors alongside text/numbers. Focus outlines and named actions are visible.
- **Image quality:** original raster portraits, icons, globes, material textures, foliage, flame, equipment illustrations and directional character atlases replace UI glyph art and humanoid placeholder geometry. Cutouts are inspected with real alpha, consistent cell margins and foot placement. The four static facings use movement bob and attack lean; they are not full walk/attack animation sequences.
- **Copy/content:** labels distinguish selected versus equipped, show level and camp restrictions, identify the six companion roles, and explain repeat hunts. Source mockup items that are absent from a player's save are not fabricated into the backpack. Functional shortcuts remain 1–6 and I/K/P/C/J; this intentionally differs from the concept's four-key example.

## Verified interactions

- 17 unit tests and all 7 browser tests passed: town purchases/storage/recruitment, navigation, mobile controls, sword-to-axe appearance/save persistence, equipment restrictions, expedition completion/reward, defeat recovery, four repeat hunts to level 6, talents/respec and all six companion roles.
- Equipment/mobile tests passed again after the preview camera correction.
- Production browser: open inventory, equip axe, turn preview, learn talent, inspect company, resize to mobile. No page errors, missing assets or horizontal overflow; development hooks absent.
- Standalone HTML opened through a local HTTP server with no external image requests and no page errors. This verifies image embedding; direct file-origin behavior remains browser-dependent.

## Follow-up work

- Environment geometry/detail is still substantially below the full-scene reference and remains part of the broader recreation goal.
- Add full walk/attack frames and eight distinct facings. Some generated rear angles are similar. Sword variants currently share a world silhouette; axe variants use the axe silhouette with elemental light accents. Individual inventory illustrations distinguish all seven weapons.
- P3: tighten portrait/world age consistency, soften remaining tiny cutout edge fringes, and add more ornamental panel framing without reducing readability.

## Implementation checklist

- [x] Replace primitive character art and preserve gameplay roots.
- [x] Verify equipment, direction changes, consistent party scale and mobile framing.
- [x] Compare full composition and detailed inventory crops against source.
- [x] Capture and inspect the corrected mobile view and Blood Moor.
- [x] Pass gameplay regressions and production-browser checks.

final result: passed

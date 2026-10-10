# v0.10 talent and backpack review

Scope: clearer build planning and loot browsing within the existing playable camp/Blood Moor slice. The [v0.9 review](docs/qa-v0.9.md) records the preceding companion combat pass. Full Act I and complete Diablo II fidelity remain unfinished.

## Visual target and evidence

The established Wrought Iron direction, existing stone inventory panel and pre-change skill screen are the references. The new original `public/art/talents.webp` atlas was opened and inspected: nine distinct bronze-framed painted emblems, with no labels embedded in the image.

- [Desktop skill comparison](docs/screenshots/skills-comparison-v0.10.webp): matching fresh level-1 state and 1440 × 900 viewport, before/after opening Skills.
- [Phone skill comparison](docs/screenshots/skills-mobile-comparison-v0.10.webp): matching state at 390 × 844. The new default Combat skills branch shows all three tiers with a readable inspector.
- [Final desktop tree](docs/screenshots/skills-v0.10.webp) and [phone tree](docs/screenshots/skills-mobile-v0.10.webp).
- [Populated backpack](docs/screenshots/inventory-loot-v0.10.webp), [filtered/sorted weapons](docs/screenshots/inventory-filtered-v0.10.webp), and [phone backpack](docs/screenshots/inventory-mobile-v0.10.webp). These use a clearly staged level-3 save containing 14 existing item definitions to inspect a representative loot collection.

Both combined comparisons and final captures were opened and inspected. Local Playwright/Chromium supplies browser verification; the cloud browser connector remains unavailable. Production verification is separate from the development fixture captures.

## Findings and resolutions

1. **P2, resolved — skill descriptions crowd every node.** Replaced nine repeated text panels with compact connected nodes and one selected-talent inspector. Current and next-rank effects, prerequisites, point cost and camp restrictions remain explicit. Inspecting a talent does not spend points.
2. **P2, resolved — mobile tree requires tiny text and hides its final tier.** Branch buttons show one complete three-tier path at a time on narrow screens. Desktop retains all three paths. The inspector uses readable text; the close and respec controls remain reachable.
3. **P2, resolved — reused equipment icons weaken skill identity.** Added original heart, gauntlet, battered shield, crossed blades, sweeping sword, executioner's axe, mana chalice, fortress shield and war-horn emblems. Learned/locked/selected states remain distinguishable through ranks, borders and action availability.
4. **P2, resolved — initial new controls use browser-white styling.** The first capture exposed missing button backgrounds on branch and quick-learn controls. Applied the existing dark bronze palette and recaptured desktop and phone layouts.
5. **P2, resolved — larger backpacks lack browsing controls.** Added category counts/filters, newest/level/value sorting and visible level badges. Sorting retains the selected item; category changes select a matching item. Empty categories give a recovery instruction. The existing comparison, equip/sell actions and dynamic weapon preview remain functional.
6. **P3 — short labels remain compact.** Level/rank badges and quick-learn labels are smaller than inspector text. The larger inspect controls and detail panel carry the full explanation. Drag-and-drop inventory placement remains outside this slice.

No unresolved P0/P1/P2 issues remain within this release's scope.

## Fidelity surfaces

- **Typography:** classical tree/character headings with readable sans-serif effects and requirements. Mobile moves detail text out of narrow columns.
- **Spacing/layout:** compact nodes and an adjacent desktop inspector; one complete branch plus inspector on phone. Backpack controls fit above the existing icon grid without horizontal overflow.
- **Colors/tokens:** dark stone, bronze borders, gold selection and restrained green next-rank improvements match the established inventory/HUD palette.
- **Image quality:** nine original framed icons replace semantically unrelated equipment icons. They remain legible at node and inspector sizes.
- **Copy/content:** current/next rank, required level/talent, point cost, filtered empty states and camp-only changes are explicit. The work does not introduce new talents or alter progression formulas.

## Verification

Focused browser checks passed for inspecting without spending, real training and prerequisites, keyboard selection, mobile branches, free respec, camp restrictions, filters/sorting, comparison, selling, equipped weapon appearance and reload persistence. Superseded skill styles were removed; talent presentation now has its own module and stylesheet.

Full regression passed: 27 unit tests and 14 browser tests (41 total), including repeated expeditions through level six. Production desktop/mobile checks trained Weapon Mastery, inspected mobile branches, purchased and equipped gear through Charsi, filtered/sorted the backpack and confirmed equipment after reload. No page errors, missing assets or horizontal overflow were observed; the development hook is absent. The standalone package trained the same talent with no external image requests. Production screenshots were opened and inspected. Formatting and build/package checks passed. GitHub deployment is verified separately after publishing.

final result: passed

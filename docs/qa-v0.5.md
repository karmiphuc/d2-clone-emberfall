# v0.5 motion and environment review

Scope: short character motion cycles, readable enemy attacks, illustrated camp/Moor props and usable inventory animation controls. This review accepts this incremental release, not complete Diablo II fidelity or a finished Act I. The [v0.4 review](qa-v0.4.md) records the preceding character/interface work.

## Visual evidence

- Source: Wrought Iron concept, `/workspace/generated_images/exec-a7beda27-92b6-4531-b36c-47df6e086183.png`, 1586 × 992. Opened and inspected alongside the implementation.
- [Reference comparison](screenshots/design-comparison-v0.5.webp): source normalized to 1440 × 900 beside the production inventory at the same viewport and scale 1. Both show camp, the worn sword equipped and an iron axe selected with a +3 damage comparison. A local save fixture supplies the axe; inventory contents otherwise reflect real implemented equipment.
- [Before/after camp](screenshots/camp-comparison-v0.5.webp): v0.4 and v0.5, fresh camp at 1440 × 900. The new tents, forge, stash, waypoint, firepit and benches replace the prominent primitive structures.
- [Camp](screenshots/camp-v0.5.webp), [inventory](screenshots/inventory-v0.5.webp), [directional preview](screenshots/preview-v0.5.webp), [skills](screenshots/skills-v0.5.webp), [Blood Moor](screenshots/moor-v0.5.webp).
- [Motion strip](screenshots/motion-v0.5.webp): actual renderer crops, walk A, walk B, windup and strike. Deterministic development staging sets the phase and facing; this is not a mockup pasted over the game.
- [Mobile](screenshots/mobile-v0.5.webp): 390 × 844, inventory with axe attack preview. Full head, weapon and feet fit; motion controls and Close remain reachable without horizontal overflow.

Camp, inventory, skills and mobile screenshots use the production build. Moor and motion views use development staging; first-area gameplay is independently covered by browser tests. Local Playwright/Chromium provided browser evidence; the cloud browser connector was unavailable in this session.

## Findings and fixes

1. **P2, resolved — tent bases clipped by terrain.** The first capture (`v05-camp-first.png`) showed billboards sunk into the ground. Props now shift their foot position along the ground toward the front of their footprint instead. The second and production captures show complete bases and tent entrances.
2. **P2, resolved — preview controls overlap boots.** The initial overlay crowded the lower figure. Motion controls and the equipment caption now occupy their own rows below the canvas. The final mobile capture shows the full axe attack pose and readable selected-state controls.
3. **P2, resolved — held companions never finish a swing.** Animation recovery now advances independently of following/path movement. Unit and rendered browser tests verify recovery while holding formation.
4. **P2, resolved — unreadable static enemy attacks.** Fallen, Risen and Brute use raised-weapon telegraph and strike frames synchronized with the existing combat simulation. Unit tests cover held windups; the browser test observes both actual atlas rows during an encounter.
5. **P3, improved — oversized grass clutter.** The initial environment pass overfilled the camp center. Grass placement now leaves the central services and fire routes clear. Grass uses a single instanced draw per area.

No unresolved P0/P1/P2 regressions remain within this release's scope. Broader visual differences from the concept remain explicitly open below.

## Required fidelity surfaces

- **Typography:** existing Cinzel headings and Inter interface copy retain the classical hierarchy and readable compact labels. Stand, Walk and Attack are explicit text controls.
- **Spacing/layout:** the inventory's portrait/equipment, comparison/action and backpack sequence remains intact. The motion row increases preview height without obscuring the figure or clipping mobile controls.
- **Colors/tokens:** stone, muted brass, parchment, oxblood actions and red/blue resource globes remain consistent. The environment still has a warmer, flatter ground treatment than the reference's cool dusk lighting.
- **Image quality:** original transparent atlases supply four directional facings, two short walking poses and hero/enemy attack poses. Cell margins, boot placement, weapon visibility and rendered pose changes were inspected. Illustrated scenery replaces the largest camp placeholders; terrain, fences and smaller props remain mixed geometry and raster art.
- **Copy/content:** preview state says which weapon is being inspected; equipped slots retain the actual equipped weapon until the player presses Equip. Buttons expose selected state through `aria-pressed`. No nonfunctional talents or campaign promises were added.

## Verification

- **21 unit tests and 8 browser tests passed.** Coverage includes motion timing, held recovery, actual sword/axe and enemy atlas selection, equipment/save persistence, town transactions, navigation, narrow-screen UI, full expedition rewards, defeat recovery, four hunts to level 6, talent allocation/respec and all six companion roles.
- Production browser checked camp, selected weapon comparison, Stand/Walk/Attack preview, mobile framing and talent learning: no page errors, missing assets or horizontal overflow. Development hooks are absent.
- Standalone HTML loaded through a local HTTP server and rendered the attack preview: no external image requests or page errors. The artifact is approximately 16 MB. Direct file-origin storage behavior remains browser-dependent.
- Browser staging behind a tent verified fading to 0.30 opacity with depth writing disabled; collision footprints stay intact.
- Production build and standalone packaging passed. Software-rendered browser verification does not establish a hardware performance target.

## Follow-up work

- Longer, smoother eight-direction cycles. The two generated stride poses vary in strength by facing; companion attacks still lean and monsters retain idle silhouettes while walking.
- More cohesive dusk lighting, ground contact shadows and terrain detail. Remaining fence, wagon and small prop geometry is visibly simpler than the concept.
- Greater ornament and larger character artwork in the inventory. Existing layout prioritizes working comparisons, equipment state and mobile controls; it is not a pixel-for-pixel match.
- Den of Evil and subsequent Act I content remain unimplemented.

## Implementation checklist

- [x] Integrate original motion/scenery atlases and preserve combat/navigation roots.
- [x] Inspect actual motion frames and compare source, before and after screenshots.
- [x] Fix ground clipping and mobile preview overlap, then recapture.
- [x] Pass progression, equipment and motion regression tests.
- [x] Verify production and standalone builds in Chromium.

final result: passed

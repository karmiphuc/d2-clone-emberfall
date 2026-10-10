# v0.6 combat presentation review

Scope: coherent attack feedback, distinct companion effects, readable combat, defeat transitions and a more complete return portal. This accepts the incremental combat presentation release, not a finished Diablo II recreation or Act I. Prior [character/interface](qa-v0.4.md) and [motion/environment](qa-v0.5.md) reviews retain the broader reference comparisons.

## Reference and browser evidence

The new visual source is the original transparent effects atlas, `/workspace/generated_images/exec-c2d450df-d3d0-4b0e-8f25-37f253bcdb31.png`, inspected before integration. Its eight cells provide silver cleave, impact sparks, frost, healing, protection, embers, shadow and holy light. The established Wrought Iron concept remains the overall palette and interface reference; this pass does not claim its full-scene fidelity.

- [Cleave and party combat](screenshots/cleave-v0.6.webp), 1440 × 900 at scale 1: actual rendered combat events, separated damage numbers, Guard and the return portal.
- [Elemental party](screenshots/elemental-v0.6.webp): Soren, Aldric and Nyx in an actual first encounter with frost, holy and shadow effects.
- [Effect-layer comparison](screenshots/effects-comparison-v0.6.webp): identical frozen encounter/camera, effects hidden on the left and visible on the right. Damage text is hidden in both so the comparison isolates effects. This is a controlled renderer comparison, not a historical screenshot of v0.5.
- [Production camp](screenshots/combat-camp-v0.6.webp) and [mobile settings](screenshots/settings-mobile-v0.6.webp), 390 × 844.

Moor captures use development staging to place the party and freeze the short effects; gameplay is separately verified by real encounter tests. Production captures use normal controls with no debug hook. Local Playwright/Chromium provided browser evidence because the cloud browser connector was unavailable.

## Findings and fixes

1. **P2, resolved — simultaneous attacks obscure enemies.** The first elemental capture showed a large white center where frost, holy and shadow hits overlapped. Reduced minor impact size/opacity, companion slash opacity, and major burst size/opacity. The final capture retains enemy silhouettes and blue chilled-state labels around the impact.
2. **P2, resolved — effects ignore their recipient.** Healing previously pulsed at the hero regardless of the wounded ally. Effects now resolve actor/target IDs from actual combat events. The browser test wounds Bram and verifies both restored life and a healing effect at Bram's position. Guard follows the moving hero for its active duration.
3. **P2, resolved — damage numbers stack into ambiguous values.** Repeated hits on a victim now use separate horizontal positions and an additional vertical offset for larger bursts. The final cleave capture shows the distinct 9, 4 and 14 hits.
4. **P2, resolved — dead enemies disappear instantly.** Defeated enemies collapse and fade over 0.55 seconds. The simulation marks them dead immediately; the focused browser test verifies the visible transition and final removal.
5. **P2, resolved — regression during damage-label adjustment.** An intermediate broad replacement referenced the damage record from NPC/enemy-label code and caused frame errors. Restricted offsets to damage labels, reran the full suite, and recaptured with zero page errors.
6. **P3, improved — placeholder portal.** Replaced the plain torus and flat polygon base with a tinted illustrated protection sigil above the stone waypoint artwork.

No unresolved P0/P1/P2 regressions remain in this release's scope.

## Required fidelity surfaces

- **Typography:** existing classical headings and compact interface labels remain. Damage values retain their readable parchment/red distinction; offsets prevent repeated hits merging into one apparent number.
- **Spacing/layout:** the HUD and equipment layout are unchanged. The reduced-effects control fits the mobile settings dialog without horizontal overflow.
- **Colors/tokens:** silver/gold melee, blue frost, green healing, violet shadow and gold holy effects distinguish roles against the muted Moor. Lower opacity prevents additive effects washing out nearby figures.
- **Image quality:** original transparent raster artwork supplies the effects and portal. Shared atlas cells and a 64-sprite pool keep allocation bounded. Effects use real world positions, short lifetimes and no extra per-effect lights.
- **Copy/content:** Sound now describes both wind and combat cues. Reduce combat effects softens opacity and suppresses hit flashes; its default honors the system reduced-motion preference. No new progression promises or nonfunctional skills were added.

## Verification

- 21 unit tests and all 9 browser tests passed, covering town, navigation, equipment/save persistence, motion, effects, expedition/reward, defeat and repeated hunts through level 6 with all companion roles.
- After the final damage-label/practice-audio adjustment, the focused effects browser test passed again, including healing position, following Guard, bounded allocation, expiry, retreat cleanup, defeat transition, reduced effects and sound controls.
- Production and standalone browser checks: no page errors, missing assets or horizontal overflow; production debug hook absent; standalone makes no external image requests. Build and packaging passed.
- Sound controls and audio-node execution were exercised in Chromium; subjective audio quality was not evaluated through listening.
- The pool cap is verified, but a hardware frame-rate target is not established by software-rendered browser tests.

## Follow-up

- Longer, smoother directional animation and stronger companion-specific attack poses.
- More physical projectile timing, richer sound recordings and a broader range of enemy attacks.
- Clearer action cooldown/status feedback and further terrain/lighting cohesion.
- Den of Evil and the remaining Act I campaign remain unimplemented.

final result: passed

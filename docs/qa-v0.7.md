# v0.7 action feedback review

Scope: responsive Cleave input, visible action state and a readable desktop/mobile HUD. The [v0.6 combat-art review](qa-v0.6.md) and earlier linked reviews preserve the broader visual references and unresolved campaign scope. This pass does not certify complete Diablo II fidelity or Act I.

## Visual evidence

The existing illustrated stone action bar is the visual reference for this pass: keep its artwork, shortcuts and hierarchy while adding compact state information. The established Wrought Iron concept remains the overall design direction.

- [Desktop HUD](screenshots/hud-v0.7.webp): 1440 × 900, Guard active and company holding.
- [Focused comparison](screenshots/hud-comparison-v0.7.webp): two equal 700 × 210 crops from the same frozen encounter, new text hidden on the left and shown on the right. This isolates the added feedback; it is not a historical v0.6 capture. Both the baseline and current render were opened and inspected.
- [Mobile HUD](screenshots/hud-mobile-v0.7.webp): 390 × 844; status box, action labels and timers fit without horizontal overflow or instruction overlap.

Moor screenshots use development staging to position and pause the party. Production and standalone builds were separately opened with normal controls; production has no debug hook. Local Playwright/Chromium provided browser verification because the cloud browser connector was unavailable.

## Findings and fixes

1. **P1, resolved — Cleave competes with basic attack timing.** Selecting an enemy continually starts basic attacks when their cooldown finishes, making presses of Cleave between them feel ineffective. Cleave now stores one pending intent, resolves before the next basic attack, rechecks range/mana and spends only when executed. Repeated presses do not stack. Movement, regroup and retreat cancel the intent.
2. **P2, resolved — Guard has no persistent state feedback.** Its action now shows active duration, then remaining cooldown, with an active border and a compact status line. Hold exposes its formation state; low mana, potion availability and Battle Cry cooldown also have short labels.
3. **P2, resolved — mobile status overlaps instructions.** The first narrow capture placed the status over the generic control hint. On narrow screens the active status now replaces that hint until it expires. Recaptured mobile evidence shows no overlap.

No unresolved P0/P1/P2 issues remain within this action-feedback scope.

## Required fidelity surfaces

- **Typography:** existing display headings and UI fonts remain. Compact timer/status text sits above action names and preserves shortcut visibility.
- **Spacing/layout:** no extra action slots or panels were introduced. The status line sits above the existing HUD; mobile wraps it and temporarily suppresses generic instructions.
- **Colors/tokens:** muted brass active borders and parchment state text match the existing stone bar. Cooling actions dim their illustration while keeping names readable.
- **Image quality:** original action artwork remains unchanged and visible. No substitute glyph or placeholder art was introduced.
- **Copy/content:** Queued, Holding, Full and timer labels reflect real simulation state. Guard and Hold expose `aria-pressed`; button names include their visible state. Timers do not use an assertive live region.

## Verification

- **23 unit tests and all 10 browser tests passed.** The full expedition and four hunts to level 6 remain playable with queueing enabled, alongside equipment persistence, talents, all companion roles, motion and effects coverage.
- New unit tests verify single execution, deferred mana spending, cancellation without charge, and Guard timer values. The browser test verifies active Guard, cooldown styling, successful queued Cleave, hold status and narrow-screen bounds.
- Production and standalone checks passed: no page errors, missing assets or horizontal overflow; no production debug hook; standalone artwork is embedded with no external image requests.
- Formatting, production build and standalone packaging passed.

## Follow-up

- Further environment and lighting cohesion, longer directional animations and more varied enemy attacks.
- Den of Evil and the remaining Act I campaign are still unimplemented. The current scope remains a playable camp and repeatable first-area slice.

final result: passed

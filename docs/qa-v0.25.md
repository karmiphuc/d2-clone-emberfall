# v0.25 — Direct monster targeting

Floating monster names, health bars, chilled boxes and selection boxes are removed. Mouse and touch input go directly to the existing alpha-aware world picker, so blank sprite margins remain ground. Invisible, named attack buttons retain keyboard and assistive-technology access, with a visible keyboard focus indicator and selection state. Loot labels and the separate identity/health inspection panel remain available.

A steady red outside contour confirms the selected living creature. It follows the exact current rigged frame rather than a second animation or rectangular overlay. Padding extends the quad without moving the authored root or scaling the artwork; both outline sampling and picking respect the original frame bounds, preventing neighbouring packed frames from appearing or becoming accidental targets. Width follows screen derivatives and render pixel ratio, targeting three CSS pixels. Existing body colors, lighting, hit feedback and weapon attachments are preserved.

Hovering another monster changes inspection without moving the selection contour. Switching targets, death, cancellation and camp return remove the old marker. Duplicate hover/selection ground rings and brightness washes are removed.

## Evidence

- [Desktop Ashen Brute](screenshots/target-outline-v0.25.png) and [390 × 844 phone view](screenshots/target-outline-mobile-v0.25.png) show the completed source at normal game scale without floating monster boxes or viewport overflow.
- [Runtime targeting reel](screenshots/target-outline-v0.25.webm) shows combat, changing authored poses and switching from Mournfang to Embercaller. This controlled 30 fps capture uses 0.75 render pixel ratio and is a presentation reference, not a hardware benchmark. No character atlas or animation timing changes were made.
- Browser coverage exercises actual silhouette clicks, transparent-margin movement, secondary attacks, touch selection, keyboard targeting, hover inspection, death/camp cleanup and quiet UI defaults. Pixel checks verify a red contour while preserving an opaque body pixel and leaving an unselected copy unmarked. Shader errors are included in the touch test's failure checks.
- Existing boss motion, monster idle and equipment regressions remain required alongside the full unit/browser suite and production build. Astra review remains disabled at the user's request.

# v0.21.2 — Combat focus

The creature panel uses the existing dark metal/parchment UI palette. It shows health, elite identity, attack victim and chilled/taunted state. Hover inspection takes priority without modifying combat selection. Otherwise, the nearest visible, engaged elite within twelve world units takes priority over the selected regular creature. Dead and offscreen creatures cannot retain the panel; returning to camp hides it.

An amber bar fills during the existing 0.5-second regular or 0.95-second elite windup, then clears at contact. The same indicator appears beneath each creature's overhead health bar. It is presentation only: attack range, damage, movement, authored animation and saves are unchanged. The health bar exposes current/max life to assistive technology without announcing changing values every frame.

Mobile review at 390 × 844 places the panel beside the party and below the entry toast. At 541–600 pixels the quest card moves to the lower right to keep the panel clear. Desktop review uses 1280 × 800 at normal in-game scale. [Combat recording](screenshots/combat-focus-v0.21.2.webm) captures actual simulation, sprites and HUD through a Brute windup, contact and recovery; this software-rendered capture is visual evidence, not a device performance benchmark.

Regression coverage checks focus priority, inspection preserving attack intent, hidden/dead/distant elites, both windup durations, death cleanup, camp return and mobile bounds. Existing targeting, Brute contact/death and Gravewarden selection browser checks also run. The deployment pipeline runs the complete unit/browser suite and production build before publication.

# Architecture

Emberfall is a static Vite application deployed to GitHub Pages. Three.js handles rendering; DOM elements handle accessible controls and dialogs. There is no backend, authentication, analytics or multiplayer service.

- `src/main.js`: UI, service interactions, application state and local persistence.
- `src/world.js`: procedural camp, rendering, character models and navigation.
- `src/game/combat.js`: pure battle simulation, encounter definitions and combat events.
- `src/game/save.js`: versioned save normalization and one-time reward transaction.
- `src/wilderness.js`: authored Blood Moor scenery.
- `src/style.css`: responsive game interface.
- `tests/e2e`: real-browser gameplay regression checks.

Camp geometry is merged by material; grass is instanced. A clearance-aware A\* grid prevents walking through camp props. Party members follow individual paths. The development-only `window.__camp` hook enables deterministic navigation and state checks; Vite removes it from production.

Save data is device-local. Maintain compatibility with the `emberfall-camp-v1` storage key when adding fields. The app needs to work when storage is unavailable. An old prototype save must not prevent loading the game.

The frame loop advances gameplay in 1/30-second steps, capped to avoid large jumps when the tab resumes. Dialogs pause simulation. Combat receives plain actor positions and emits presentation events; no Three.js objects enter the save. Reload restores the party at camp while keeping defeated enemies, drop locations, purchases and rewards. Living enemies currently reset to full health on reload.

The current scene/navigation module still owns movement and presentation together. Extract reusable navigation before adding the dungeon. Continuous performance tests on integrated GPUs and real mobile devices are still needed; software-rendered browser tests verify behavior, not a target frame rate.

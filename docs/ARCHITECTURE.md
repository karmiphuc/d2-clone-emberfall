# Architecture

Emberfall is a static Vite application deployed to GitHub Pages. Three.js handles rendering; DOM elements handle accessible controls and dialogs. There is no backend, authentication, analytics or multiplayer service.

- `src/main.js`: UI, service interactions, application state and local persistence.
- `src/world.js`: procedural camp, rendering, character models and navigation.
- `src/game/combat.js`: pure battle simulation, encounter definitions and combat events.
- `src/game/save.js`: versioned save normalization, migration, one-time rewards and repeat-hunt resets.
- `src/game/items.js`: item catalog, deterministic drop rolls, equipment statistics and inventory transactions.
- `src/game/progression.js`: level cap, XP thresholds and prerequisite-aware talent allocation.
- `src/game/companions.js`: shared role definitions for simulation, models and recruitment.
- `src/wilderness.js`: authored Blood Moor scenery.
- `src/style.css`: responsive game interface.
- `tests/e2e`: real-browser gameplay regression checks.

Camp geometry is merged by material; grass is instanced. A clearance-aware A\* grid prevents walking through camp props. Party members follow individual paths. The development-only `window.__camp` hook enables deterministic navigation and state checks; Vite removes it from production.

Save data is device-local. Maintain compatibility with the `emberfall-camp-v1` storage key when adding fields. The app needs to work when storage is unavailable. An old prototype save must not prevent loading the game.

The frame loop advances gameplay in 1/30-second steps, capped to avoid large jumps when the tab resumes. Dialogs pause simulation. Combat receives plain actor positions and emits presentation events; no Three.js objects enter the save. Reload restores the party at camp while keeping defeated enemies, drop locations, purchases and rewards. Living enemies currently reset to full health on reload.

The current scene/navigation module still owns movement and presentation together. Extract reusable navigation before adding the dungeon. Continuous performance tests on integrated GPUs and real mobile devices are still needed; software-rendered browser tests verify behavior, not a target frame rate.

## Progression boundaries

The first area is an authored repeatable encounter. Hunt resets require every drop to be collected, reset only encounter-local data, and retain player progression. Drop instances are stable within a hunt and unique between hunts. Uncollected item rolls and locations survive reloads. Inventory is capped at 60 slots; overflow converts to the item’s sale value.

Save schema 2 retains the original storage key and upgrades schema-1 weapon/charm purchases into equipped items. Talent points are derived from XP and spent ranks rather than separately persisted. Save normalization enforces allowed IDs, ranks, prerequisites, level requirements and a maximum of three active companions. Level 6 is an explicit playtest cap, not the full campaign cap.

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

## Presentation and equipment

`src/actor-sprites.js` creates transparent directional figures on Three.js actor roots. Camera-relative facing selects one of four atlas columns. Sword and axe equipment select different hero rows; elemental weapons add a local light. Movement, combat and saves keep the same actor API. `src/characters.js` provides shared equipment definitions, monster selection and a disposable directional preview renderer. Inventory uses seven separate weapon illustrations. `src/animation.js` advances movement phase and swing recovery independently of path following, so held companions finish their attacks. Hero sword/axe atlases each provide two walk poses and windup/strike frames across four facings. Companion atlases provide two walk poses per role. Monster atlases hold the windup pose for the simulation telegraph and switch to strike on the `enemyAttack` event. Companion attacks still lean; monsters do not yet have walk frames. The inventory preview uses the same animation state and can loop Stand, Walk or Attack.

Atlas textures share loaded image sources while retaining per-actor UV transforms. Actor and preview disposal release all cloned textures and materials. Animation does not change combat damage, collision roots or save data.

`src/art.js` maps semantic item IDs and companion names to original illustrated atlases. All images are local; no asset CDN is needed. The standalone packager embeds CSS images and 3D material images as data URLs. Browser tests verify weapon sprite row/save agreement and narrow-screen controls.

The camera follows the hero while preserving the isometric angle. `src/scenery.js` shares illustrated prop atlas images and renders grass in one instanced draw per area. Prop bases are shifted toward their ground footprint rather than sunk into the ground plane. Large props and trees fade when their projected bounds obscure the hero; faded sprites stop writing depth. Collision geometry and first-area encounter rules are preserved.

## Combat feedback

Combat events carry actor and target IDs. `world.combatVisual` resolves their world positions without changing simulation damage or cooldowns. `src/combat-effects.js` shares eight atlas cells across a reusable pool capped at 64 sprites, with no per-effect lights. Effects age only while gameplay runs, release their slots on expiry, and clear on zone or encounter changes. Ranged trails interpolate source-to-target positions; Guard follows its actor; healing resolves the wounded actor rather than the hero. Enemy death presentation lasts 0.55 seconds while the simulation treats the enemy as defeated immediately.

The reduced-effects setting starts from `prefers-reduced-motion`, softens effect opacity and disables hit flashes. It is session-local. `src/combat-audio.js` creates short filtered-noise and tonal cues only after the player enables Sound, reuses a noise buffer, limits trigger frequency and disconnects completed nodes. Neither system writes new save fields.

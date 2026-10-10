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

The current scene/navigation module still owns movement and presentation together. The same A\* route function now serves dungeon party movement and enemy pursuit around solid cave walls; further extraction from `world.js` remains a cleanup opportunity. Continuous performance tests on integrated GPUs and real mobile devices are still needed; software-rendered browser tests verify behavior, not a target frame rate.

## Progression boundaries

The first area is an authored repeatable encounter. Hunt resets require every drop to be collected, reset only encounter-local data, and retain player progression. Drop instances are stable within a hunt and unique between hunts. Uncollected item rolls and locations survive reloads. Inventory is capped at 60 slots; overflow converts to the item’s sale value.

Save schema 2 retains the original storage key and upgrades schema-1 weapon/charm purchases into equipped items. Talent points are derived from XP and spent ranks rather than separately persisted. Save normalization enforces allowed IDs, ranks, prerequisites, level requirements and a maximum of three active companions. Level 6 is an explicit playtest cap, not the full campaign cap.

## Presentation and equipment

`src/actor-sprites.js` creates transparent directional figures on Three.js actor roots. Camera-relative facing selects one of four atlas columns. Sword and axe equipment select different hero rows; elemental weapons add a local light. Movement, combat and saves keep the same actor API. `src/characters.js` provides shared equipment definitions, monster selection and a disposable directional preview renderer. Inventory uses seven separate weapon illustrations. `src/animation.js` advances movement phase and swing recovery independently of path following, so held companions finish their attacks. Hero sword/axe walk atlases retain two poses; separate six-row strike atlases provide preparation, coil, contact, follow-through, recovery and guard across four facings. The simulation emits `prepare`, then `swing`/damage after 160 ms (basic) or 220 ms (Cleave); movement, lost targets and obstructed attacks cancel preparation without charging mana. Companion atlases provide two walk poses and separate release/strike–recovery pairs per role. Monster atlases hold the windup pose for the simulation telegraph and switch to strike on the `enemyAttack` event. Companion release poses begin on the actual attack/heal event and recover over 0.26 seconds; Fallen, Risen and Brutes use separate four-phase walk atlases. Gait phase advances by distance traveled, with camera-facing hysteresis to avoid quadrant chatter. Directional hit recoil and short visual impact holds do not pause simulation clocks. The inventory preview uses the same animation state and can loop Stand, Walk or Attack.

Atlas textures share loaded image sources while retaining per-actor UV transforms. Actor and preview disposal release all cloned textures and materials. Animation does not change combat damage, collision roots or save data.

`src/art.js` maps semantic item IDs and companion names to original illustrated atlases. All images are local; no asset CDN is needed. The standalone packager embeds CSS images and 3D material images as data URLs. Browser tests verify weapon sprite row/save agreement and narrow-screen controls.

The camera follows the hero while preserving the isometric angle. `src/scenery.js` shares illustrated prop atlas images and renders grass in one instanced draw per area. Prop bases are shifted toward their ground footprint rather than sunk into the ground plane. Large props and trees fade when their projected bounds obscure the hero; faded sprites stop writing depth. Collision geometry and first-area encounter rules are preserved.

## Combat feedback

Combat events carry actor and target IDs. `world.combatVisual` resolves their world positions without changing simulation damage or cooldowns. `src/combat-effects.js` shares twelve atlas cells from impact and projectile artwork in a reusable pool capped at 64 sprites, with no per-effect lights. Effects age only while gameplay runs, release their slots on expiry, and clear on zone or encounter changes. Ranged arrows and spell bolts interpolate source-to-target positions and rotate tip-first in camera space; Guard follows its actor; healing resolves the wounded actor rather than the hero. Enemy death presentation lasts 0.55 seconds while the simulation treats the enemy as defeated immediately.

The reduced-effects setting starts from `prefers-reduced-motion`, softens effect opacity and disables hit flashes, recoil and impact holds. It is session-local. `src/combat-audio.js` creates short filtered-noise and tonal cues only after the player enables Sound, reuses a noise buffer, limits trigger frequency and disconnects completed nodes. Neither system writes new save fields.

## Action intent and HUD state

Cleave can store one pending intent while the shared melee cooldown runs. The simulation resolves it before the next basic attack, checks current range and mana again, and charges only on execution. Repeated input does not stack intents. Manual movement/cancel, regroup and restore clear it. The intent is transient and never persisted. Read-only cooldown and queued-state getters drive compact action-bar feedback; the HUD does not advance timers or change combat rules.

## Terrain and direct targeting

Camp terrain composites the original stony albedo with existing path placement at higher resolution. The Moor uses its own repeating earth texture rather than copying the camp's paths. Zone changes select ambient/directional light colors and intensities while retaining the camp's local fire lights. Original shadow decals share a loaded image source; each actor owns its geometry/material and cloned texture, disposed with the actor or preview.

`src/sprite-picking.js` tests the current atlas frame's transformed UV against a cached 8-bit alpha mask, with its longest dimension capped at 512 pixels. Enemy raycasts exclude dead actors and shadow meshes. Hover and selected state drive the cursor, labels, subtle sprite highlighting and a ground ring.

Right-click skill targeting can retain an explicit enemy ID while approaching. The simulation rechecks life, range and mana before execution; it clears the intent on cancellation, normal retargeting, restoration or target death. Untargeted keyboard/action-bar Cleave retains its nearby-enemy behavior. No new save fields are required.

## Talent and backpack presentation

`src/skill-tree.js` renders the existing nine talents as compact connected paths and a selected-talent inspector. `src/skill-tree.css` owns this layout. Mobile shows one branch at a time, with all three tiers visible; desktop shows every branch. Node selection is separate from learning, supports arrow-key navigation and retains focus across training. Rank previews describe the existing simulation formulas; progression and camp-only training/respec rules remain in `src/game/progression.js` and the modal handlers.

Backpack filters and sort order are transient presentation state. They operate on a copied inventory array and never reorder the saved inventory. Changing category chooses a matching item; sorting retains the current selection. Equipping and selling still use the shared item functions and refresh world equipment through the existing update path. No new save fields are added.

## Connected dungeon areas

`src/game/den.js` defines three chambers joined by two passages, enemy IDs and the one-time bounty. The shared footprint drives collision, cave scenery placement and the minimap. `src/dungeon.js` owns cave lighting and original wall/entrance/altar/stalagmite art. Geometry outside the footprint is instanced; large wall props reuse the existing hero-occlusion fading.

`combat.setArea()` replaces area enemies/drops while retaining party life, mana and cooldowns. Main selects either the existing top-level Moor progress or `state.den`. Changing hostile areas resets living enemies, cancels attack intent and rebuilds actor/loot presentation; kills and rolled drops persist. Camp still restores the company. Dungeon attacks check line of sight, and engaged enemies use the shared route function when walls block direct pursuit. The Moor retains its original movement and combat behavior.

The optional `den` object keeps save schema 2 and the existing key compatible. Normalization validates dungeon IDs, claimed rewards and item uniqueness across both areas. A Moor hunt reset never resets Den progress. The dungeon is a single authored clear, without a repeat/reset action yet.

## Continuous presentation and mercenary ownership

The simulation remains fixed at 30 Hz. `world.present(alpha, dt)` interpolates actor roots, posture and pose time for each rendered frame without changing gameplay positions or attack clocks. Camera and labels follow the rendered roots. Projectiles and effect animation use fractional age. Static sun shadows refresh on area changes or shadow-mode changes.

`src/sprite-motion-material.js` samples adjacent painted frames through bidirectional UV motion fields in `public/art/motion-flow.bin`. Original raster art remains unchanged. `scripts/build-motion-flow.py` regenerates numerical fields using Pillow, numpy and OpenCV; then format `src/motion-flow-data.json`. The binary is committed and inlined by the standalone packager, so play/build/CI do not need Python dependencies. Clip/facing transitions are short blends; interpolation is approximate, especially where a weapon changes silhouette substantially.

`companionEquipment` adds four optional slots for each of the six mercenaries to schema-2 saves. Hero equipment, mercenary equipment, backpack and uncollected drops share one UID validation set. Equip/remove transactions transfer exact item instances. Dismissal retains owned gear. `companionStats` supplies life, damage, armor, casting-speed multiplier and Eira healing to the combat rules. Weapon types constrain role compatibility; current character illustrations retain their class weapon shape.

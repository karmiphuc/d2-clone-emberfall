# Changelog

## 0.11.0 — Beneath the Blood Moor

- Added a connected Den of Evil dungeon with three chambers, eleven creatures, the Gravewarden and a one-time Akara bounty.
- Added original cave entrance, limestone wall, altar and stalagmite illustrations, torchlight and a dungeon minimap.
- Added physical entrance/exit labels and nearby E interaction, retaining town retreat and existing Moor hunts.
- Separated dungeon kills and uncollected loot from Moor progress while preserving party life/mana on area changes.
- Added wall-aware dungeon attacks and enemy routing through passages.
- Added save migration/validation and end-to-end dungeon clear, return, reload and reward coverage.

## 0.10.0 — Readable talent paths and loot browsing

- Rebuilt the skill tree around compact connected talent nodes, nine original icons and a selected-talent inspector with current/next-rank effects.
- Added mobile branch navigation and keyboard node navigation; inspection never spends points and training/respec retain existing rules.
- Added backpack category filters, counts, level badges, newest/level/value sorting and filtered empty states.
- Preserved item comparison, immediate weapon appearance changes, selling and saved equipment.
- Extracted talent presentation into its own module and stylesheet, removing obsolete tree styles.
- Added browser checks for inspection/training, mobile branches, filtering/sorting and equipment persistence.

## 0.9.0 — Companion strikes and aimed spellwork

- Added original four-direction strike/release and recovery frames for all six companion roles.
- Replaced generic ranged spark trails with illustrated arrows, frost lances, divine bolts and healing motes, oriented along their flight path.
- Eira visibly casts toward the actual wounded ally; held companions complete their recovery normally.
- Enemies face their intended victim during windup, with stable authored anticipation poses.
- Added real-combat browser coverage for every companion animation and projectile type.

## 0.8.0 — Dusk atmosphere and direct skill targeting

- Added original stony camp terrain, cooler dusk lighting and separate Moor ground materials; replaced camp path placeholders with illustrated cobbles.
- Added original soft contact shadows beneath heroes, companions, NPCs and enemies.
- Added right-click Cleave on enemy silhouettes and labels: approach into range, execute once and charge mana on impact. Basic retargeting, movement and target death cancel the skill intent.
- Added visible-silhouette picking so transparent sprite margins remain clickable ground.
- Added enemy hover/selection highlights, a ground marker and an aiming cursor.
- Added targeted-skill simulation and real mouse-input regression tests.

## 0.7.0 — Responsive actions and readable combat state

- Cleave queues behind the current basic attack, executes once when ready, and spends mana only on execution. Movement, regrouping and retreat cancel the queued action.
- Added live Guard duration/cooldown, Battle Cry cooldown, queued Cleave, low-mana, potion and hold-state feedback to the existing action bar.
- Added a compact active-status line with accessible pressed states for Guard and Hold.
- On narrow screens, active combat status temporarily replaces the generic instruction line to prevent overlap.
- Added simulation tests for queued-action charging/cancellation and browser coverage for the HUD and responsive controls.

## 0.6.0 — Combat feedback and companion effects

- Added original painted cleave arcs, impact sparks, frost shards, healing wisps, protection sigils, embers, shadow slashes and holy light.
- Replaced instantaneous ranged lines with short traveling trails and distinct companion spell effects.
- Healing appears on the actual recipient; Guard follows the hero for its gameplay duration.
- Added brief hit flashes and enemy collapse/fade transitions. Actual melee strikes now align with immediate damage feedback.
- Replaced the Moor portal placeholder with a cyan sigil and illustrated stone base.
- Added opt-in synthesized combat audio and a reduced-effects setting that honors the system reduced-motion preference.
- Bounded effect allocation, reuse and cleanup across retreats and repeat hunts; added browser coverage for these behaviors.

## 0.5.0 — Character motion and illustrated environments

- Added original four-direction sword and axe walk, windup and strike poses, plus walk frames for all six companion roles.
- Added distinct windup and strike frames for Fallen, Risen and the Ashen Brute, synchronized with combat timing.
- Added Stand, Walk and Attack controls to the inventory character preview.
- Fixed held companions remaining in an attack pose after their swing.
- Replaced major camp props with illustrated tents, forge, stash, waypoint, firepit and benches.
- Added illustrated Moor rocks, graves, ruined wagon, dead trees, cobbled paths and instanced grass.
- Fade large scenery when it obscures the hero; preserve original collision footprints and encounter rules.
- Added motion timing and rendered pose regression coverage.
- Preserved saved equipment, first-area loot, repeat hunts, levels 1–6 and talents.

## 0.4.0 — Classic presentation and visible equipment

- Rebuilt the HUD with original illustrated portraits, item/action icons, life/mana globes and dark stone materials.
- Added a compact inventory side panel with a painted equipment portrait and directional preview, equipped slots, selectable backpack and explicit comparisons.
- Equipping swords and axes switches the hero’s world sprite; elemental weapons add light accents. Seven weapon-specific inventory illustrations show individual equipment.
- Replaced primitive humanoids with original directional sprites for the hero, all six companions, camp NPCs and monsters.
- Reframed the skill tree with illustrated connected ranks, clearer requirements and visible training actions.
- Added a closer hero-following camera, original forest/fire sprites, textured terrain and more legible first-area scenery.
- Added clickable named loot and direct companion swaps.
- Preserved saves, first-area encounters, levels 1–6 and repeat hunts.
- Added regression checks for equipped sprite persistence, narrow-screen UI and camera following.
- Embedded all material and UI images in the standalone downloadable build.

## 0.3.0 — First-area progression

- Made the Blood Moor repeatable after clearing enemies and collecting drops; each hunt retains the hero’s progression.
- Added levels 1–6, level-up recovery, shared companion levels and unspent talent points.
- Added three warrior talent branches with nine functional talents, prerequisites, ranks and free camp respecs.
- Added 27 equipment types, guaranteed equipment drops, four equipped slots, comparisons, vendor stock and selling.
- Expanded recruitment to six distinct roles: tank, healer, archer, mage, paladin and assassin. Enforced a maximum of three companions.
- Added taunts, healing priority, volleys, frost slows, protective auras and flanking backstabs.
- Migrated older camp saves without losing purchases, experience or quest progress.
- Added repeat-hunt, progression, talent, equipment and companion-role regression tests.

## 0.2.0 — First expedition

- Connected the eastern camp gate to an authored Blood Moor encounter.
- Added 12 enemies, including the Ashen Brute, with pursuit and dodgeable attack windups.
- Added click-to-attack, Cleave, Guard, working potions, party combat, scout shots and adept healing.
- Added enemy health bars, hit feedback, gold and potion drops, and an equippable Ashen charm.
- Added safe retreat, downed companions, defeat recovery and a one-time reward from Akara.
- Added save validation and persistent kill/drop/reward progress compatible with camp saves.
- Moved battle rules into a rendering-independent module and stepped gameplay at 30 Hz.
- Added unit and full-expedition browser regression coverage.

## 0.1.0 — Camp foundation

- Created the Three.js Rogue Encampment, four-person party and obstacle-aware navigation.
- Added recruitment, blacksmith purchase, healer, shared gold stash and a camp quest.
- Added device-local saves, minimap, responsive interface and performance settings.
- Bootstrapped GitHub Actions, test-gated Pages deployment, contributor docs and bug reporting.

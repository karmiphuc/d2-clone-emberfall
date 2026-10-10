# Changelog

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

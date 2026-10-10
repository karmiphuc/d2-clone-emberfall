# Emberfall

[![Verify and deploy](https://github.com/karmiphuc/d2-clone-emberfall/actions/workflows/pages.yml/badge.svg)](https://github.com/karmiphuc/d2-clone-emberfall/actions/workflows/pages.yml)

**[Play the latest build](https://karmiphuc.github.io/d2-clone-emberfall/)** · [Report a playtest bug](https://github.com/karmiphuc/d2-clone-emberfall/issues/new/choose)

A browser-based, party-focused action RPG prototype built with Three.js. The playable slice includes the Rogue Encampment and a complete first Blood Moor expedition: one hero, three recruitable companions, town services, enemy combat and persistent loot, levels 1–6, usable skill trees, and six companion specialties.

![Emberfall v0.8 camp at dusk](docs/screenshots/camp-v0.8.webp)

## Downloadable playtest

Run `npm run package:playtest` to produce a single HTML file in `artifacts/`. Downloaded release builds can be opened directly in a modern browser with WebGL enabled; no Node installation is needed to play. Fonts fall back to system fonts offline. Browser storage keeps progress on that device.

## Play locally

Requires Node.js 22+.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. For a production build, run `npm run build` and `npm run preview`.

## Controls

- Click the ground or use WASD / arrow keys to move.
- Click a town label to approach and interact; E interacts with a nearby service.
- Space or 3 regroups the party. 5 toggles hold/follow.
- Mouse wheel zooms. I opens inventory; J journal; P party; C character; K or T opens skill trees.
- Left-click enemies to approach and attack. Right-click an enemy or its label to approach and use Cleave. 1 cleaves (8 mana), queuing once behind an ongoing basic attack; moving cancels the queue. 2 guards for 3 seconds (10 mana, 8-second cooldown); 4 heals; 6 retreats and restores the company.
- Click a nearby loot label or walk over a drop to collect it. Downed companions recover in camp.
- Escape closes dialogs. Wind and combat sound are opt-in from the Sound button. Settings can soften combat effects; the system reduced-motion preference is honored.

## Classic presentation

The camp and Blood Moor use distinct terrain and dusk lighting, soft character contact shadows, a closer hero-following isometric camera, original illustrated tents, town services, foliage and fire, textured ground and detailed directional character sprites. Hero sword/axe attacks have distinct windup and strike poses; the hero and all six companions have short walk cycles. Monsters visibly wind up and strike. Cleave, frost, healing, holy and shadow attacks use original painted effects; hits flash briefly and defeated enemies collapse. Guard stays around the hero for its active duration, and healing effects identify the actual recipient. The classic stone HUD has illustrated portraits, life/mana globes and labelled actions. The action bar shows queued Cleave, Guard duration/cooldown, Battle Cry cooldown, low mana, potion availability and party hold state. Inventory is a side panel with a painted equipment portrait and a directional character preview with Stand, Walk and Attack controls, illustrated slots and side-by-side item comparisons. Sword and axe world sprites switch immediately when equipped and survive reload; elemental weapons add a light accent. All seven weapons have individual inventory illustrations. Enemy hover/selection highlights and silhouette-aware picking make targets clearer; transparent sprite margins remain ground. Nearby drops have clickable name labels. The skill tree shows connected ranks and requirements, with free camp respecs.

This is a stylized, original-asset interpretation of the classic game, not a pixel-perfect recreation of Diablo II or Resurrected.

## Included

- Isometric camp with illustrated tents, forge, stash, waypoint, forest, animated fire, sparks and lighting.
- Click-to-move A\* paths with obstacle clearance and companion following.
- Akara's introduction, camp preparation quest, rest, and potion purchases.
- Charsi's weapon purchase and equipment change.
- Recruitment, direct companion swaps and dismissal through Kashya, shared gold stash, and a camp waypoint.
- Local browser save, reset option, performance mode, and a live minimap.

Enter the eastern gate to fight 12 enemies, including the Ashen Brute. Clear the encounter, collect the Ashen charm, and claim 100 gold and two potions from Akara. Retreat at any time; slain enemies and uncollected drops persist. Reloading starts the party safely in camp.

After collecting all 12 drops, return to the eastern gate and choose **Start fresh hunt**. Progress, equipment, talents and recruitment choices carry over. Four clears reach the level-6 playtest cap; enemy scaling stops after hunt 4. Each enemy guarantees an equipment drop. The 60-slot bag automatically sells overflow drops. Change equipment and talents in camp.

Bram taunts and absorbs damage; Eira heals injured allies; Ilyra fires volleys; Soren slows groups with frost; Aldric protects nearby allies; Nyx flanks and backstabs. Companions share your level and grow in life and damage.

This is an early vertical slice, not a completed Act I. The Den of Evil, remaining campaign, additional hero classes, companion-specific talent trees and multiplayer are not implemented. Combat balance and environment geometry remain provisional. Characters use original four-direction painted sprites with short authored walk and hero/enemy attack cycles. Companion attacks still use a lean; monster walking uses the idle silhouette. Eight-direction animation and longer, smoother cycles remain unfinished. No Diablo assets are bundled.

## GitHub Pages

The included `.github/workflows/pages.yml` builds and deploys on pushes to `main`. The repository owner must enable Pages once: Settings → Pages → Source → **GitHub Actions**. The workflow attempts enablement where permissions allow. Vite uses relative asset paths so repository subpaths work.

## Structure

- `src/world.js`: rendering, camp, characters, grid navigation and animation.
- `src/wilderness.js`: authored wilderness scenery.
- `src/actor-sprites.js` and `src/animation.js`: directional atlases and motion state.
- `src/combat-effects.js` and `src/combat-audio.js`: pooled effect sprites and opt-in combat cues.
- `src/scenery.js`: illustrated props, instanced grass and hero occlusion fading.
- `src/sprite-picking.js`: compact alpha masks for visible-silhouette targeting.
- `src/game/combat.js`: rendering-independent battle rules and encounter data.
- `src/game/save.js`: save validation, migration, repeat hunts and reward transactions.
- `src/game/items.js`: equipment definitions, drops and inventory transactions.
- `src/game/progression.js`: level thresholds and talent requirements.
- `src/game/companions.js`: role definitions and party-size enforcement.
- `src/main.js`: UI, town interactions, party state, local saves.
- `src/style.css`: responsive game interface.

## Next milestone

Den of Evil: connected dungeon rooms, a clear objective, quest rewards and return portals. Then expand skills, equipment and companion tactics before adding the remaining Act I campaign.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md), [architecture](docs/ARCHITECTURE.md) and the [chapter roadmap](PLAN.md). Browser tests run before every deployment. Development test hooks are excluded from production builds.

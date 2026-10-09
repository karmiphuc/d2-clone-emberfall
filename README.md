# Emberfall

[![Verify and deploy](https://github.com/karmiphuc/d2-clone-emberfall/actions/workflows/pages.yml/badge.svg)](https://github.com/karmiphuc/d2-clone-emberfall/actions/workflows/pages.yml)

**[Play the latest build](https://karmiphuc.github.io/d2-clone-emberfall/)** · [Report a playtest bug](https://github.com/karmiphuc/d2-clone-emberfall/issues/new/choose)

A browser-based, party-focused action RPG prototype built with Three.js. The first playable slice is the Rogue Encampment: one hero, three recruitable companions, and working town services.

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
- Mouse wheel zooms. I opens inventory; J journal; P party; C character.
- 1 practices a sword swing; 2 displays guard feedback; 4 preserves potions when health is full; 6 returns to the campfire.
- Escape closes dialogs. Sound is opt-in from the music button.

## Included

- Real-time 3D camp with procedural geometry, forest, tents, forge, animated fire, cloth, sparks, and lighting.
- Click-to-move A\* paths with obstacle clearance and companion following.
- Akara's introduction, camp preparation quest, rest, and potion purchases.
- Charsi's weapon purchase and equipment change.
- Recruitment/dismissal through Kashya, shared gold stash, and a camp waypoint.
- Local browser save, reset option, performance mode, and a live minimap.

This is a camp playtest, not a completed Act I. There are no wilderness areas, enemy combat, skill progression, or multiplayer yet. The Blood Moor gate explains that boundary. Models are original procedural placeholders; no Diablo assets are bundled.

## GitHub Pages

The included `.github/workflows/pages.yml` builds and deploys on pushes to `main`. In repository Settings → Pages, select **GitHub Actions** as the source. Vite uses relative asset paths so repository subpaths work.

## Structure

- `src/world.js`: rendering, environment, characters, grid navigation, animation.
- `src/main.js`: UI, town interactions, party state, local saves.
- `src/style.css`: responsive game interface.

## Next milestone

Blood Moor → first enemy encounter → loot → Den of Evil, building on the existing camp and party systems. Separate the simulation from presentation as combat is introduced; add fixed-step updates and a versioned content schema before expanding campaign content.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md), [architecture](docs/ARCHITECTURE.md) and the [chapter roadmap](PLAN.md). Browser tests run before every deployment. Development test hooks are excluded from production builds.

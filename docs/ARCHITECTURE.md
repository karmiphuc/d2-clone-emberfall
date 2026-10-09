# Architecture

Emberfall is a static Vite application deployed to GitHub Pages. Three.js handles rendering; DOM elements handle accessible controls and dialogs. There is no backend, authentication, analytics or multiplayer service.

- `src/main.js`: UI, service interactions, application state and local persistence.
- `src/world.js`: procedural camp, rendering, character models and navigation.
- `src/style.css`: responsive game interface.
- `tests/e2e`: real-browser gameplay regression checks.

Camp geometry is merged by material; grass is instanced. A clearance-aware A\* grid prevents walking through camp props. Party members follow individual paths. The development-only `window.__camp` hook enables deterministic navigation and state checks; Vite removes it from production.

Save data is device-local. Maintain compatibility with the `emberfall-camp-v1` storage key when adding fields. The app needs to work when storage is unavailable. An old prototype save must not prevent loading the game.

The next gameplay milestone moves battle rules into a rendering-independent simulation with a fixed timestep. Campaign state should remain serializable; Three.js objects must not enter save data.

# Contributing

Use Node 22 (`nvm use`), then `npm ci`. Run `npm run dev` for a local game.

Before a pull request:

```sh
npm run format
npx playwright install chromium
npm test
npm run build
```

If using an installed Chromium, set `CHROMIUM_PATH` for the test command. Tests start their own Vite server. Changes to `main` deploy only after browser tests and the production build pass.

Keep simulation rules separate from Three.js presentation. Add regression coverage for gameplay state transitions, save compatibility, pathfinding failures and economic transactions. Avoid tests that merely restate visual markup.

Use small, descriptive commits. Describe the player-visible change, how it was tested and known limits in each PR. Never commit credentials or copy proprietary game assets. The project currently uses original procedural placeholders.

For a playtest bug, include your browser, the steps taken, expected/actual behavior and whether it occurs in a fresh save. Settings → Reset camp progress clears this browser's save after confirmation.

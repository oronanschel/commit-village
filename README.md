# commit-village

A 3D browser village that grows with its contributors: everyone who joins, person or agent, gets a house.

Built with Three.js, Vite and TypeScript. Static build, no backend.

## Run it

```sh
npm install
npm run dev      # open the printed URL
npm run build    # static site in dist/
npm test         # node:test unit tests (src/**/*.test.ts)
```

## Controls

| Action | Keys |
| --- | --- |
| Walk | W A S D or arrow keys |
| Run | Shift |
| Turn | Q / E, or drag with the mouse |
| Touch | Left thumb (lower-left) walks with a joystick, drag elsewhere to look |

The sky follows your local clock. Add `?hour=7.5` (0–24) to the URL to preview another time of day.

## Layout

- `src/main.ts` – renderer, scene, camera and the frame loop (`onTick(fn)` registers per-frame callbacks)
- `src/scene/` – ground, fire and the day/night sky (`sky.ts`)
- `src/controls/` – player movement

## Contributing

Keep the village playable at every step and send small PRs. Only original work:
no code, art, names or layouts copied from other games. Document every asset in
[ASSETS.md](ASSETS.md).

Code is MIT licensed (see [LICENSE](LICENSE)).

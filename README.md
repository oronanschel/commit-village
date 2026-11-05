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

Meet a neighbour by clicking a house or its name tag, or open the Neighbours list
and choose a name with the keyboard. See [CONTRIBUTING.md](CONTRIBUTING.md) to add
your home using `public/contributors.json`.

Keep the village playable at every step and send small PRs. Only original work:
no code, art, names or layouts copied from other games. Document every asset in
[ASSETS.md](ASSETS.md).

Code is MIT licensed (see [LICENSE](LICENSE)).

## Village charter

Every member, person or agent, gets one free 12 × 12 m plot in the next open spot
of the innermost ring with space, recorded in `village/plots.json` in the same PR
as their house. Plots are never sold; unused plots return to the commons after
30 days without activity. Build within your own plot without a vote, keeping the
game running smoothly. Neighbours may form a district with everyone's agreement
in the PR.

The fire, roads, square and empty rings are commons. Building there or changing
the charter needs a proposal: a file in [`village/proposals/`](village/proposals/)
and an issue or PR labelled **proposal**. Each plot owner gets **one 👍 or 👎 vote
on the voting PR**. Voting stays open **at least 30 minutes**, needs **at least two
voters**, and passes only with **more than half 👍**. Passed proposals are merged
and results recorded in [`village/decisions.md`](village/decisions.md). Oron may
veto decisions that break safety, licensing or the original-work rule.

See [claiming a plot and proposing](CONTRIBUTING.md#village-charter-and-proposals)
for the steps and proposal template.

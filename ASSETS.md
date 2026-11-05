# Asset sources and licenses

Every asset in Commit Village must be original work or carry a license that
allows redistribution. Add a row here in the same PR that adds an asset.

| Asset | Where | Source | Author | License |
| --- | --- | --- | --- | --- |
| Ground, rocks, campfire (stones, logs, flames) | `src/scene/ground.ts`, `src/scene/fire.ts` | Procedural geometry written for this repo | Commit Village contributors | MIT (code) |
| Cottage, timber house and tower | `src/village/houses.ts` | Original box/sphere/extruded triangle constructions; no downloaded mesh or texture | Commit Village contributors (AI-assisted) | MIT (code) |
| Fireflies, birds, smoke puffs | `src/scene/ambient.ts` | Procedural geometry written for this repo | Commit Village contributors | MIT (code) |

House silhouettes, dimensions, palettes and details were authored for this project.
The initial registry records public project members Oron, hearth-claude and
hearth-codex. Agent descriptions identify AI assistance without claiming human
authorship or review.

No external models, textures, sounds or fonts are used yet. When glTF models
arrive, store them under `public/models/`, compress with Draco or meshopt, and
list them above.

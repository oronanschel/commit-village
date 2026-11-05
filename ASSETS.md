# Asset sources and licenses

Every asset in Commit Village must be original work or carry a license that
allows redistribution. Add a row here in the same PR that adds an asset.

| Asset | Where | Source | Author | License |
| --- | --- | --- | --- | --- |
| Ground, rocks, campfire (stones, logs, flames) | `src/scene/ground.ts`, `src/scene/fire.ts` | Procedural geometry written for this repo | Commit Village contributors | MIT (code) |

No external models, textures, sounds or fonts are used yet. When glTF models
arrive, store them under `public/models/`, compress with Draco or meshopt, and
list them above.

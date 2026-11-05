# Join the village

Every person and agent who joins can have a home. Start with a small pull request;
keep the village playable and ask another contributor to review it before merging.

## Add your house

1. Add one entry to `public/contributors.json`. Keep existing IDs and plots stable.
2. Choose a free plot and one of the original house styles below.
3. Run `npm test` and `npm run build`, then open a pull request. Include a screenshot
   if you change the village's appearance. Label AI assistance in your PR.

```json
{
  "id": "your-name",
  "name": "Your name",
  "kind": "person",
  "houseStyle": "cottage",
  "plot": { "ring": 1, "slot": 2 },
  "description": "What you are building here."
}
```

- `id`: unique, permanent lowercase letters/digits separated by single hyphens.
- `name`: a public display name, 1–48 characters. Never put private contact details here.
- `kind`: `person` or `agent`. Agents have their own homes and should identify themselves.
- `houseStyle`: `cottage` (warm plaster, clay roof), `timber` (sage walls and beams),
  or `tower` (tall lilac stone). All are original procedural models.
- `plot`: ring starts at **1**. Ring `r` has `8 × r` slots, numbered **0** through
  `8 × r - 1`. Ring 1 starts 14 metres from the fire; each next ring adds 10 metres.
  Slot 0 is north of the fire, and slots proceed clockwise. Every entrance faces
  the fire. Rings 1–8 are supported by the layout; outer rings may need the ground
  and walk bounds expanded in the same PR. Check those before claiming an outer plot.
- `description`: optional public text, at most 240 characters.

A plot belongs to one entry. The validator rejects duplicate IDs, overlapping plot
addresses, unknown styles and invalid addresses. Reordering the JSON does not move
any home. Names and descriptions are rendered as text, never HTML.

## Build something for everyone

Decorations, paths, accessibility improvements, performance work, documentation and
new house styles are welcome. Keep changes small enough to review. For new styles,
update the typed style list, house builder, tests and this guide together.

Use original code and assets. Document every asset's source and license in
[`docs/ASSETS.md`](docs/ASSETS.md). Do not copy game art, names, maps or layouts.
Do not add dependencies or binary assets without explaining their purpose and license.

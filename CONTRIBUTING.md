# Join the village

Every person and agent who joins can have a home. Start with a small pull request;
keep the village playable and ask another contributor to review it before merging.

## Add your house

1. Claim the next free plot in the innermost ring with room in `village/plots.json`,
   in the same PR as your house. Use one permanent owner ID per person or agent.
2. Add the matching entry to `public/contributors.json` and choose an original
   house style below. Keep existing IDs and plot claims stable.
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
  `tower` (tall lilac stone) or `windmill` (stone tower with sails). All are original procedural models.
- `plot`: rings **1–5** are supported. Each plot is a **12 × 12 m** square
  facing the fire. Ring 1 has **8 slots**, starts 21 metres from the fire,
  and each next ring adds 14 metres. Capacity depends on square-plot clearance:
  use `slotsInRing(ring)` in `src/village/plots.ts`; slots start at **0**.
  Slot 0 is north of the fire, and slots proceed clockwise. Claim the next open
  spot of the innermost ring with space in `village/plots.json`; keep your house's
  ring/slot identical. Tests check plot overlap, ground bounds and house fit.
- `description`: optional public text, at most 240 characters.

A plot belongs to one entry. The validator rejects duplicate IDs, overlapping plot
addresses, unknown styles and invalid addresses. Reordering the JSON does not move
any home. Names and descriptions are rendered as text, never HTML.

## Build something for everyone

Decorations, paths, accessibility improvements, performance work, documentation and
new house styles are welcome. Commons construction needs the vote described below. Keep changes small enough to review. For new styles,
update the typed style list, house builder, tests and this guide together.

Use original code and assets. Document every asset's source and license in
[`ASSETS.md`](ASSETS.md). Do not copy game art, names, maps or layouts.
Do not add dependencies or binary assets without explaining their purpose and license.


## Village charter and proposals

### Claim a plot

The charter allocates one free **12 × 12 m** plot per member (people and agents
both qualify), in rings around the central fire. Choose the next open spot of
the innermost ring with space and record it in `village/plots.json` in the same
PR as your house. Plots cannot be sold. Unused plots return to the commons after
30 days without activity; reclamation should be explicit in a reviewed PR.

Use the ring/slot addresses described above and keep the house entry consistent
with the plot registry. Tests check that plots do not overlap and houses fit.
The existing founding claims retain their addresses; new claims fill the next
open inner-ring spot.

On your own plot, houses, gardens and decorations need no vote if they stay
within its boundary and keep the game running smoothly. Two or more neighbours
can join plots into a district when every affected owner agrees in the PR.

### Propose a commons or charter change

The fire, roads, square, empty rings and all land outside claimed plots are
commons. Building there or changing these rules requires a vote.

1. Copy [`village/proposals/TEMPLATE.md`](village/proposals/TEMPLATE.md) to a
   numbered file such as `village/proposals/0001-short-title.md`. State the
   change, reason, proposer owner ID and any original-work or licensing impact.
2. Open a PR containing the file and add the **proposal** label. You can start
   with a labelled issue, but link the file and a single voting PR: votes happen
   on that PR. If you cannot add a label, ask a maintainer to add it.
3. Record the opening time and earliest closing time in UTC. Leave voting open
   **at least 30 minutes** after the voting PR opens. Each plot owner gets exactly
   **one 👍 or 👎 vote on the PR**. Identify the owner ID if the account is shared
   or does not clearly match the registry; use an attributed 👍/👎 comment so the
   vote can be audited. Do not count a reaction and a comment as two votes, or
   treat multiple agents using one account as one owner. Resolve ambiguous or
   conflicting votes with the owner before counting them.
4. At closing, verify at least **two distinct plot owners** voted. It passes only
   when **more than half** of valid votes are 👍; a tie fails, and fewer than two
   voters cannot pass. Oron may veto a decision that breaks safety, licensing or
   the original-work rule. Normal code review does not replace this vote.
5. Record the closing time, owner-by-owner evidence, totals and result in
   [`village/decisions.md`](village/decisions.md) and the proposal. Merge passed
   proposals after normal review and checks; link a separate implementation PR
   when needed. Do not merge a proposal early even if everyone has voted.

# Pavilion

An event floor planner where a person and an AI agent edit the same scaled floor plan, and a layout engine checks every change, whoever makes it.

**Live demo:** https://pavilion-nine.vercel.app (no account needed: **Try the live demo** gives you your own copy of the Nova Product Launch, deleted after 24 hours). A second copy runs at https://pavilion.76-13-10-76.sslip.io with its own database.

Built with [Agent-Native](https://www.agent-native.com) for the Builder.io Agent-Native Hackathon, 2026.

## Try it in 60 seconds

1. **Open the demo.** You land on the Nova Product Launch: an 18 × 12 m hall with a stage, two screens, 120 chairs in six rows, a registration desk, a refreshment station, two exits and a pillar. The header reads 120 of 120 guests seated and US$3,040 of a US$4,000 budget (example prices).
2. **Break a rule.** Drag a chair onto the stage or into an exit. The move is refused and nothing is saved. Drag it to an empty spot and it saves; the plan version goes up.
3. **Ask the agent.** Open the agent panel (top right) and click **Fit 20 more seats**. The agent runs the planner and comes back with a proposal: seats 120 → 140, cost US$3,040 → US$3,130, 20 chairs added, the locked exits and pillar untouched. The plan itself has not changed.
4. **Compare.** Flip between **Current** and **Proposal**, or switch the plan to **3D** and watch the 20 new chairs rise into place.
5. **Decide and export.** Press **Apply** (only a person can) and the plan becomes the next version. Then **Export** a setup pack: a scaled plan as SVG, PNG or printable HTML, the item list, the seating rows and where every item goes.

## What it does

**The engine decides; the agent proposes.** Geometry, capacity, cost and validation are deterministic TypeScript. Every write is checked the same way, whether it comes from a drag, the inspector or the agent: objects stay inside the walls, solid objects never overlap each other or an exit's keep-clear zone, and locked objects keep their place. A refused write saves nothing.

**Redesigns arrive as proposals.** `propose-layout` runs a deterministic theatre or banquet planner. It keeps locked and non-seating objects where they are and keeps every chair a minimum aisle (1.2 m by default) from walls and fixed objects. It reports seats and cost before and after, what is added, moved or removed, and any shortfall. With 1.2 m aisles the Nova hall holds at most 156 theatre seats; ask for 200 and the proposal says it is 44 short rather than bending a rule.

**Nothing overwrites newer work.** Every write carries the plan version it was based on, and a stale one is rejected. A proposal is bound to the version it was planned from: if anyone edits the plan in the meantime, Apply is refused and the proposal offers Regenerate.

**One plan, three views.** The 2D plan is where you edit (drag, marquee, keyboard, inspector). The 3D view draws the same saved plan with typical heights; you can orbit it and click to select, and proposals show added chairs in blue as they rise. Setup packs freeze a version for the crew.

## How it uses Agent-Native

|                               |                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One set of actions**        | The UI and the agent change a plan only through 17 Pavilion `defineAction()` contracts in [`actions/`](actions/): `get-layout`, `add-objects`, `move-objects`, `update-object`, `lock-objects`, `remove-objects`, `propose-layout`, `export-setup-pack` and the rest. The canvas calls them through `useActionQuery` / `useActionMutation`; the agent calls the same ones as tools. Dragging a chair and asking the agent to move it both run `move-objects`. |
| **Shared screen context**     | The plan publishes `navigation` (view and event) and `selection` (the selected object IDs). [`view-screen`](actions/view-screen.ts) returns the selection verified against the plan, with labels and positions, so "what have I selected?" or "lock these" resolve to what is on screen.                                                                                                                                                                      |
| **People apply**              | [`apply-proposal`](actions/apply-proposal.ts) and [`restore-version`](actions/restore-version.ts) are `uiOnly`: they are not among the agent's tools. The agent proposes; a person applies.                                                                                                                                                                                                                                                                   |
| **Prompts follow the screen** | The agent panel's starters come from the screen in view: a plan, a selection or a setup pack ([`app/lib/agent-prompts.ts`](app/lib/agent-prompts.ts)).                                                                                                                                                                                                                                                                                                        |
| **Live sync**                 | Changes made by the agent appear on the plan, in 2D and 3D, without a refresh.                                                                                                                                                                                                                                                                                                                                                                                |
| **Guest sandboxes**           | `POST /api/demo/start` signs a visitor in as an isolated guest with their own seeded event. Demo starts and guest agent messages are rate-limited in SQL before any model call.                                                                                                                                                                                                                                                                               |

The agent's operating rules are in [`AGENTS.md`](AGENTS.md): read the screen before acting on "this", batch related changes, report a refused write instead of retrying blindly, never unlock what the person did not ask to unlock, never invent a price, and leave Apply to the person.

## Where the logic lives

| Path                                            | What it holds                                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `shared/geometry/`                              | Footprints, wall and collision checks, keep-clear zones, free-spot search                                         |
| `shared/layout/`                                | Seat and cost summary, layout diff, descriptions                                                                  |
| `server/lib/planner/`                           | The theatre and banquet planners                                                                                  |
| `server/lib/proposals/`, `server/lib/versions/` | Proposals bound to a base version, history snapshots                                                              |
| `shared/export/`                                | The setup-pack renderer (SVG plan with dimensions, scale bar and north arrow, item list, printable HTML)          |
| `shared/scene/`                                 | The pure mapping from plan objects to 3D blocks                                                                   |
| `actions/`                                      | The contracts the UI and the agent share                                                                          |
| `app/`                                          | The React Router UI: events, floor plan, 3D view, proposal review, setup packs, landing                           |
| `deploy/vps/`                                   | The self-hosted copy (Node behind nginx, PostgreSQL in Docker); the main demo runs on Vercel with Neon PostgreSQL |

## Run it

```bash
pnpm install
pnpm dev
```

Editing, proposals from **Suggest layout**, history and export all work with no model key. To talk to the agent, configure a model provider, for example `OPENAI_API_KEY` with `AGENT_ENGINE=ai-sdk:openai`.

```bash
pnpm typecheck && pnpm test && pnpm agent-native:doctor
```

The 82 tests cover the geometry engine, both planners (including the 156-seat limit above), the layout summary and diff, the setup-pack renderer, the 3D blocks, the demo seed, the guest rate limits and the agent prompts.

## Pre-existing work

Pavilion started from the Agent-Native chat template (`@agent-native/core` 0.226.0). Everything Pavilion-specific was built during the hackathon. The full list of templates, libraries and AI assistance is in [`docs/PROVENANCE.md`](docs/PROVENANCE.md).

## Limits

- Prices are example data, not supplier quotes.
- Capacity is modelled seating under the clearance rules above, not legal occupancy.
- The layout check covers walls, overlaps, keep-clear exits and aisle distance. It is not a certified evacuation model.
- The planner produces recommended layouts, not optimal ones, and plans theatre rows and banquet tables only.
- 3D heights are typical values per item; the catalog stores footprints only. Editing happens on the 2D plan.
- There is no undo yet. History restores the versions saved when proposals are applied.
- In a new guest's first minute, the framework may re-check the session and redraw the app once, which can close the agent panel. Reopen it and carry on.

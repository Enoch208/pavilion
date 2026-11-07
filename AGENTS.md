# Pavilion — Agent Guide

Pavilion is a spatial event planner. A person and the agent edit one floor plan through the same actions. `/events` lists the person's events; `/events/<eventId>` is the floor plan. Chat stays at `/chat`.

## Floor plan

- Units: positions and sizes are integer millimetres, origin at the venue's north-west corner, `xMm` east and `yMm` south, measured to an object's top-left corner. Rotation is 0, 90, 180 or 270 degrees; 90 and 270 swap width and depth. Money is integer cents. Show metres and dollars to people.
- The layout engine checks every write. Objects stay inside the venue walls. Solid objects never overlap each other or a keep-clear exit zone; area markers may overlap anything. A refused write (`LAYOUT_INVALID`) saves nothing: tell the person which objects clash and ask before trying other positions.
- Locked objects (`OBJECT_LOCKED`) keep their position, size and rotation. Never unlock unless the person asks.
- Every write carries `expectedVersion` from `get-layout` or `view-screen`. On `VERSION_CONFLICT`, read again and reapply the person's request once.
- Seats and cost come from `get-layout`. Catalog prices are example data; never invent prices, sizes or capacities.
- Batch related changes (a row of chairs) into one call.

| Action         | Use                                                                         |
| -------------- | --------------------------------------------------------------------------- |
| view-screen    | Open event, plan version and verified selection; call before "this"/"these" |
| list-events    | The person's events                                                         |
| get-layout     | Venue, objects, seats, cost, issues, version                                |
| get-catalog    | Placeable items: footprint, seats, example price                            |
| add-objects    | Place catalog items; omit x/y for the free spot nearest the centre          |
| move-objects   | Move objects                                                                |
| update-object  | Label, size, rotation, seats, unit cost                                     |
| lock-objects   | Lock or unlock                                                              |
| remove-objects | Remove objects                                                              |

## Core rules

- UI feedback: target 100 ms, never exceed 400 ms; acknowledge before network work.
- Normal app data must flow through actions. Keep actions deterministic and focused; use agent chat/AgentSidebar for AI work and follow-ups in the same thread. Keep structured state in SQL and large files in configured storage; persist references only.
- For external integrations, inspect the workspace/provider connection catalog first; reuse its scoped resolver. Never hardcode credentials, webhook URLs, or private/customer data.
- Never fabricate. Report failures and recover; verify writes by reading the row or screen. Navigation is in `<current-screen>`; use `view-screen` for fresh visible-record details.

For custom branding, keep `server/plugins/agent-native-email-branding.ts` aligned: `app.name` appears in transactional email and optional `app.logoUrl` must be an absolute HTTPS URL.

## Application state

- `navigation` describes the view and selected ids: `events` at `/events`, `event` at `/events/<eventId>` with `eventId`, `chat` at `/chat` and `/chat/<threadId>`.
- `selection` holds the object ids selected on the floor plan; `view-screen` returns them verified, with labels and positions.
- Use `navigate` (`--view event --eventId <id>`) to open a floor plan and `view-screen` for a fresh read.

## Pavilion dev rules (for coding agents)

- Every persistent operation is a `defineAction()` in `actions/`. The UI calls it through `useActionQuery`/`useActionMutation`, the agent as a tool. No REST route or agent-only path duplicates an action.
- Actions stay thin. Geometry, planning, constraints, pricing, revisions and export are pure, deterministic functions with unit tests in `tests/`: under `shared/<area>/` when the canvas needs them too (geometry, catalog, layout summary), otherwise under `server/lib/<area>/`.
- A mutating action validates input with zod and resolves the caller from the action context, never from args. It then checks ownership, loads the current state and validates the change. It writes in one transaction, bumps the plan version and records an audit row. It returns the updated resource or a structured validation failure.
- Writes carry `expectedVersion`; a stale version is rejected, never merged.
- Geometry is integer millimetres, money is integer cents, rotation is a multiple of 90°.
- Prices, dimensions and capacities come from the seeded catalog or the user, never from the model.
- `apply-proposal` and `restore-version` are human-only. The agent proposes; a person applies.
- Locked objects are never moved by the planner or the agent.
- Manual editing works with no model key configured.
- Keep this file's runtime sections (everything above this one) under 6,000 characters; the runtime prompt cuts the file there.
- Done = `pnpm typecheck`, `pnpm test`, `pnpm format:check`, `pnpm agent-native:doctor` all clean.

## Skills

Search with `rg --hidden --follow`; read the exact linked guide before deeper work. `.agents/skills/adding-a-feature/SKILL.md` — cross-area feature checklist. Data/integrations: `.agents/skills/actions/SKILL.md`, `.agents/skills/storing-data/SKILL.md`, `.agents/skills/security/SKILL.md`, `.agents/skills/secrets/SKILL.md`, `.agents/skills/sharing/SKILL.md`. UI: `.agents/skills/frontend-design/SKILL.md`, `.agents/skills/shadcn-ui/SKILL.md`, `.agents/skills/client-side-routing/SKILL.md`. Agent context/workflows: `.agents/skills/context-awareness/SKILL.md`, `.agents/skills/real-time-sync/SKILL.md`, `.agents/skills/reliable-mutations/SKILL.md`, `.agents/skills/performance/SKILL.md`, `.agents/skills/delegate-to-agent/SKILL.md`. Framework: `.agents/skills/agent-native-docs/SKILL.md`, `.agents/skills/agent-native-toolkit/SKILL.md`, `.agents/skills/customizing-agent-native/SKILL.md`. Before building common workspace or agent UI, read `agent-native-toolkit`.

Use local docs only (no web research): `pnpm action docs-search --query "<topic>"`, `pnpm action docs-search --slug "<slug>"`, `pnpm action docs-search --list`, `pnpm action source-search --query "<pattern>"`, `pnpm action source-search --path <path>`, or `pnpm action source-search --list`.

import { catalogItem, type CatalogItem } from "../../../shared/catalog.js";
import type { PlacedObject } from "../../../shared/contracts/layout.js";
import { findIssues } from "../../../shared/geometry/index.js";
import { toShape } from "../../../shared/layout/shape.js";
import { summarizeLayout } from "../../../shared/layout/summary.js";
import { assignSeats, type Assignment } from "./assign.js";
import { SEATING_KINDS, seatingContext, theatreParams } from "./context.js";
import { scoreCandidate } from "./score.js";
import { candidateRows, fillRows } from "./seating.js";
import { describePlan } from "./summary.js";
import type {
  PlanningInput,
  PlanResult,
  SeatingContext,
  SeatingParams,
} from "./types.js";

const DRAFT_ID_PREFIX = "draft:";

type Candidate = {
  seated: number;
  params: SeatingParams;
  assignment: Assignment;
  objects: PlacedObject[];
  rows: number;
  score: number;
};

function requireItem(id: string): CatalogItem {
  const item = catalogItem(id);
  if (!item) throw new Error(`Planner needs catalog item ${id}`);
  return item;
}

function evaluate(
  input: PlanningInput,
  context: SeatingContext,
  params: SeatingParams,
  shared: {
    kept: PlacedObject[];
    replaceable: PlacedObject[];
    item: CatalogItem;
    needed: number;
  },
): Candidate | null {
  const rows = candidateRows(context, params);
  const seats = fillRows(rows, shared.needed, context, shared.item.capacity);
  let draftCount = 0;
  const assignment = assignSeats({
    seats,
    previous: shared.replaceable,
    item: shared.item,
    newId: () => `${DRAFT_ID_PREFIX}${(draftCount += 1)}`,
  });
  const objects = [...shared.kept, ...assignment.objects];
  if (findIssues(objects.map(toShape), input.venue).length > 0) return null;
  const summary = summarizeLayout({
    attendeeTarget: input.attendeeTarget,
    budgetCents: input.budgetCents,
    objects,
  });
  const usedRows = new Set(seats.map((seat) => seat.row));
  const depth = input.venue.heightMm - context.firstRowYMm;
  const meanY =
    seats.reduce((sum, seat) => sum + seat.yMm, 0) / Math.max(1, seats.length);
  return {
    seated: Math.min(summary.seats, input.attendeeTarget),
    params,
    assignment,
    objects,
    rows: usedRows.size,
    score: scoreCandidate({
      seats: summary.seats,
      attendeeTarget: input.attendeeTarget,
      params,
      minAisleMm: input.minAisleMm,
      costCents: summary.totalCostCents,
      budgetCents: input.budgetCents,
      meanRowDepth:
        seats.length === 0 ? 0 : (meanY - context.firstRowYMm) / depth,
      unchanged: assignment.unchanged,
      comparedWith: Math.max(shared.replaceable.length, seats.length),
    }),
  };
}

function ranksAbove(a: Candidate, b: Candidate): boolean {
  return a.seated > b.seated || (a.seated === b.seated && a.score > b.score);
}

export function planLayout(input: PlanningInput): PlanResult {
  const kept = input.objects.filter(
    (object) => !SEATING_KINDS.has(object.kind) || object.locked,
  );
  const replaceable = input.objects.filter(
    (object) => SEATING_KINDS.has(object.kind) && !object.locked,
  );
  const item = requireItem("chair-standard");
  const lockedSeats = kept
    .filter((object) => SEATING_KINDS.has(object.kind))
    .reduce((sum, object) => sum + object.capacity, 0);
  const needed = Math.max(0, input.attendeeTarget - lockedSeats);
  const context = seatingContext({
    venue: input.venue,
    kept,
    minAisleMm: input.minAisleMm,
    unitWidthMm: item.widthMm,
    unitDepthMm: item.heightMm,
    clearanceMm: input.minAisleMm,
  });
  const shared = { kept, replaceable, item, needed };
  let best: Candidate | null = null;
  for (const params of theatreParams(input.minAisleMm)) {
    const candidate = evaluate(input, context, params, shared);
    if (candidate && (!best || ranksAbove(candidate, best))) best = candidate;
  }
  const chosen =
    best ??
    ({
      seated: 0,
      params: theatreParams(input.minAisleMm)[0]!,
      assignment: {
        objects: [],
        added: 0,
        removed: replaceable.length,
        moved: 0,
        unchanged: 0,
      },
      objects: kept,
      rows: 0,
      score: 0,
    } satisfies Candidate);
  const objects = chosen.objects.map((object) =>
    object.id.startsWith(DRAFT_ID_PREFIX)
      ? { ...object, id: input.newId() }
      : object,
  );
  return describePlan(input, { ...chosen, objects });
}

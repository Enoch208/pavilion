import type { PlacedObject } from "../../../shared/contracts/layout.js";
import { summarizeLayout } from "../../../shared/layout/summary.js";
import type { Assignment } from "./assign.js";
import type { PlanningInput, PlanResult, SeatingParams } from "./types.js";

const metres = (mm: number) => `${Number((mm / 1_000).toFixed(2))} m`;
const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

export function describePlan(
  input: PlanningInput,
  chosen: {
    params: SeatingParams;
    assignment: Assignment;
    objects: PlacedObject[];
    rows: number;
    score: number;
  },
): PlanResult {
  const before = summarizeLayout({
    attendeeTarget: input.attendeeTarget,
    budgetCents: input.budgetCents,
    objects: input.objects,
  });
  const after = summarizeLayout({
    attendeeTarget: input.attendeeTarget,
    budgetCents: input.budgetCents,
    objects: chosen.objects,
  });
  const { added, removed, moved } = chosen.assignment;
  const lockedKept = input.objects.filter((object) => object.locked).length;
  const notes: string[] = [];
  if (after.unseated > 0) {
    notes.push(
      `Shortfall: ${after.seats} of ${input.attendeeTarget} guests seated, ${after.unseated} short. The hall has no more room with ${metres(input.minAisleMm)} clearance around the walls and fixed objects.`,
    );
  }
  if (after.unseated > 0 && input.mode === "banquet") {
    notes.push(
      "Each round table needs 0.5 m around it for chairs and at least a 0.9 m lane to the next table's chairs. Theatre rows seat more in the same floor.",
    );
  }
  if (lockedKept > 0) {
    notes.push(
      `${lockedKept} locked object${lockedKept === 1 ? "" : "s"} kept exactly in place.`,
    );
  }
  const { params } = chosen;
  const tables = chosen.assignment.objects.length;
  const summary =
    input.mode === "banquet"
      ? [
          `Banquet seating for ${after.seats} at ${plural(tables, "table")} of 8 in ${plural(chosen.rows, "row")}`,
          `${metres(params.aisleMm)} aisles`,
          `${metres(params.pitchMm)} between table centres.`,
        ].join(", ")
      : [
          `Theatre seating for ${after.seats} in ${plural(chosen.rows, "row")}`,
          `${params.blocks} blocks of up to ${params.unitsPerBlock}`,
          `${metres(params.aisleMm)} aisles`,
          `${metres(params.pitchMm)} row spacing.`,
        ].join(", ");
  return {
    objects: chosen.objects,
    summary: `${summary} ${added} added, ${moved} moved, ${removed} removed.`,
    report: {
      mode: input.mode,
      attendeeTarget: input.attendeeTarget,
      minAisleMm: input.minAisleMm,
      seatsBefore: before.seats,
      seatsAfter: after.seats,
      shortfall: after.unseated,
      costBeforeCents: before.totalCostCents,
      costAfterCents: after.totalCostCents,
      budgetCents: input.budgetCents,
      overBudget: after.overBudget,
      added,
      removed,
      moved,
      kept: chosen.objects.length - chosen.assignment.objects.length,
      rows: chosen.rows,
      params,
      score: Number(chosen.score.toFixed(4)),
      notes,
    },
  };
}

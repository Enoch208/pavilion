import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import type { ProposalView } from "../../../shared/contracts/proposal.js";
import { getDb, schema } from "../../db/index.js";
import { recordNote } from "../layout/commit.js";
import { loadObjects, requireEventRow, requirePlan } from "../layout/load.js";
import { planLayout } from "../planner/plan.js";
import type { PlanningMode } from "../planner/types.js";
import type { Scope } from "../scope.js";
import { toProposalView } from "./records.js";

export type ProposeInput = {
  planId: string;
  mode?: PlanningMode | undefined;
  attendeeTarget?: number | undefined;
  minAisleMm?: number | undefined;
};

function planningMode(mode: string): PlanningMode {
  return mode === "banquet" ? "banquet" : "theatre";
}

export function proposeLayout(
  scope: Scope,
  input: ProposeInput,
): Promise<ProposalView> {
  return getDb().transaction(async (tx) => {
    const { plan, venue } = await requirePlan(tx, scope, input.planId);
    const event = await requireEventRow(tx, scope, plan.eventId);
    const objects = await loadObjects(tx, scope, plan.id);
    const mode = input.mode ?? planningMode(plan.mode);
    const attendeeTarget = input.attendeeTarget ?? event.attendeeTarget;
    const minAisleMm = input.minAisleMm ?? plan.minAisleMm;
    const result = planLayout({
      venue,
      objects,
      mode,
      attendeeTarget,
      minAisleMm,
      budgetCents: event.budgetCents,
      newId: randomUUID,
    });
    const { layoutProposals } = schema;
    await tx
      .update(layoutProposals)
      .set({ status: "rejected", decidedAt: new Date() })
      .where(
        and(
          eq(layoutProposals.planId, plan.id),
          eq(layoutProposals.ownerEmail, scope.ownerEmail),
          eq(layoutProposals.status, "pending"),
        ),
      );
    const [row] = await tx
      .insert(layoutProposals)
      .values({
        id: randomUUID(),
        planId: plan.id,
        ownerEmail: scope.ownerEmail,
        baseVersion: plan.version,
        mode,
        attendeeTarget,
        minAisleMm,
        objects: result.objects,
        report: result.report,
        summary: result.summary,
        createdBy: scope.actor,
      })
      .returning();
    await recordNote(tx, scope, plan, {
      action: "propose-layout",
      summary: `Proposed: ${result.summary}`,
      payload: { proposalId: row!.id, attendeeTarget, mode, minAisleMm },
    });
    return toProposalView(row!, plan.version);
  });
}

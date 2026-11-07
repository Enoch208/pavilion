import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { PlacedObject } from "../../../shared/contracts/layout.js";
import {
  PlanReport,
  type ProposalView,
} from "../../../shared/contracts/proposal.js";
import { schema, type DbLike } from "../../db/index.js";
import { reject } from "../errors.js";
import type { Scope } from "../scope.js";

export type ProposalRow = typeof schema.layoutProposals.$inferSelect;

const PlacedObjects = z.array(PlacedObject);

export function toProposalView(
  row: ProposalRow,
  currentVersion: number,
): ProposalView {
  const report = PlanReport.parse(row.report);
  return {
    id: row.id,
    baseVersion: row.baseVersion,
    stale: row.baseVersion !== currentVersion,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    mode: report.mode,
    attendeeTarget: row.attendeeTarget,
    minAisleMm: row.minAisleMm,
    summary: row.summary,
    report,
    objects: PlacedObjects.parse(row.objects),
  };
}

export async function findPendingProposal(
  db: DbLike,
  scope: Scope,
  planId: string,
) {
  const { layoutProposals } = schema;
  const [row] = await db
    .select()
    .from(layoutProposals)
    .where(
      and(
        eq(layoutProposals.planId, planId),
        eq(layoutProposals.ownerEmail, scope.ownerEmail),
        eq(layoutProposals.status, "pending"),
      ),
    )
    .orderBy(desc(layoutProposals.createdAt))
    .limit(1);
  return row ?? null;
}

export async function requireProposal(
  db: DbLike,
  scope: Scope,
  proposalId: string,
) {
  const { layoutProposals } = schema;
  const [row] = await db
    .select()
    .from(layoutProposals)
    .where(
      and(
        eq(layoutProposals.id, proposalId),
        eq(layoutProposals.ownerEmail, scope.ownerEmail),
      ),
    )
    .for("update");
  if (!row) reject("NOT_FOUND", "That proposal does not exist.");
  return row;
}

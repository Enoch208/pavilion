import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { PlacedObject } from "../../../shared/contracts/layout.js";
import { summarizeLayout } from "../../../shared/layout/summary.js";
import { getDb, schema, type DbLike } from "../../db/index.js";
import { reject } from "../errors.js";
import { requirePlan } from "../layout/load.js";
import type { LayoutState } from "../layout/snapshot.js";
import type { Scope } from "../scope.js";

const HISTORY_LIMIT = 30;
const PlacedObjects = z.array(PlacedObject);

export type VersionRow = typeof schema.layoutVersions.$inferSelect;

export function stateOf(row: VersionRow): LayoutState {
  return {
    objects: PlacedObjects.parse(row.objects),
    attendeeTarget: row.attendeeTarget,
    mode: row.mode,
    minAisleMm: row.minAisleMm,
  };
}

export async function listVersions(scope: Scope, planId: string) {
  const db = getDb();
  const { plan } = await requirePlan(db, scope, planId, { lock: false });
  const { layoutVersions } = schema;
  const rows = await db
    .select()
    .from(layoutVersions)
    .where(
      and(
        eq(layoutVersions.planId, plan.id),
        eq(layoutVersions.ownerEmail, scope.ownerEmail),
      ),
    )
    .orderBy(desc(layoutVersions.version), desc(layoutVersions.createdAt))
    .limit(HISTORY_LIMIT);
  return {
    planId: plan.id,
    currentVersion: plan.version,
    versions: rows.map((row) => {
      const state = stateOf(row);
      const summary = summarizeLayout({
        attendeeTarget: state.attendeeTarget,
        budgetCents: 0,
        objects: state.objects,
      });
      return {
        id: row.id,
        version: row.version,
        reason: row.reason,
        createdAt: row.createdAt.toISOString(),
        seats: summary.seats,
        attendeeTarget: state.attendeeTarget,
        objectCount: state.objects.length,
        costCents: summary.totalCostCents,
      };
    }),
  };
}

export async function requireVersion(
  db: DbLike,
  scope: Scope,
  versionId: string,
) {
  const { layoutVersions } = schema;
  const [row] = await db
    .select()
    .from(layoutVersions)
    .where(
      and(
        eq(layoutVersions.id, versionId),
        eq(layoutVersions.ownerEmail, scope.ownerEmail),
      ),
    );
  if (!row) reject("NOT_FOUND", "That saved version does not exist.");
  return row;
}

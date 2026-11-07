import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import type { PlacedObject } from "../../../shared/contracts/layout.js";
import { findIssues, type VenueSize } from "../../../shared/geometry/index.js";
import { describeIssues } from "../../../shared/layout/describe.js";
import { schema, type Tx } from "../../db/index.js";
import { reject } from "../errors.js";
import type { Scope } from "../scope.js";
import { toShape, type PlanRow } from "./records.js";

export function assertVersion(plan: PlanRow, expectedVersion: number) {
  if (plan.version === expectedVersion) return;
  reject(
    "VERSION_CONFLICT",
    `The layout changed since you read it (now version ${plan.version}, you sent ${expectedVersion}). Read it again and reapply the change.`,
    { planId: plan.id, expectedVersion, actualVersion: plan.version },
  );
}

export function assertUnlocked(objects: readonly PlacedObject[]) {
  const locked = objects.filter((object) => object.locked);
  if (locked.length === 0) return;
  reject(
    "OBJECT_LOCKED",
    `${locked.map((object) => object.label).join(", ")} ${locked.length === 1 ? "is" : "are"} locked. Unlock first to change position, size or rotation.`,
    { objectIds: locked.map((object) => object.id) },
  );
}

export function assertPlaceable(
  venue: VenueSize,
  objects: readonly PlacedObject[],
  changedIds: ReadonlySet<string>,
) {
  const issues = findIssues(objects.map(toShape), venue, changedIds);
  if (issues.length === 0) return;
  const labels = new Map(objects.map((object) => [object.id, object.label]));
  reject(
    "LAYOUT_INVALID",
    describeIssues(issues, (id) => labels.get(id) ?? id, changedIds),
    { issues },
  );
}

export function findById(
  objects: readonly PlacedObject[],
  ids: readonly string[],
): PlacedObject[] {
  const byId = new Map(objects.map((object) => [object.id, object]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    reject(
      "NOT_FOUND",
      `${missing.length} object id(s) are not on this plan. Read the layout and use its ids.`,
      { objectIds: missing },
    );
  }
  return ids.map((id) => byId.get(id)!);
}

export async function recordChange(
  tx: Tx,
  scope: Scope,
  plan: PlanRow,
  change: { action: string; summary: string; payload: Record<string, unknown> },
): Promise<number> {
  const { layoutPlans, layoutActions } = schema;
  const version = plan.version + 1;
  const [updated] = await tx
    .update(layoutPlans)
    .set({ version, updatedAt: new Date() })
    .where(
      and(
        eq(layoutPlans.id, plan.id),
        eq(layoutPlans.ownerEmail, scope.ownerEmail),
        eq(layoutPlans.version, plan.version),
      ),
    )
    .returning({ version: layoutPlans.version });
  if (!updated) {
    reject(
      "VERSION_CONFLICT",
      "The layout changed while saving. Read it again and reapply the change.",
      { planId: plan.id, expectedVersion: plan.version },
    );
  }
  await tx.insert(layoutActions).values({
    id: randomUUID(),
    planId: plan.id,
    ownerEmail: scope.ownerEmail,
    actor: scope.actor,
    action: change.action,
    version,
    summary: change.summary,
    payload: change.payload,
  });
  return version;
}

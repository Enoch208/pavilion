import type { PlacedObject } from "../../../shared/contracts/layout.js";
import { getDb, type Tx } from "../../db/index.js";
import type { Scope } from "../scope.js";
import { assertVersion } from "./commit.js";
import { loadObjects, requirePlan } from "./load.js";
import type { PlanRow, VenueRow } from "./records.js";

export type PlanEdit = {
  tx: Tx;
  plan: PlanRow;
  venue: VenueRow;
  objects: PlacedObject[];
};

export function withPlan<T>(
  scope: Scope,
  input: { planId: string; expectedVersion: number },
  edit: (state: PlanEdit) => Promise<T>,
): Promise<T> {
  return getDb().transaction(async (tx) => {
    const { plan, venue } = await requirePlan(tx, scope, input.planId);
    assertVersion(plan, input.expectedVersion);
    const objects = await loadObjects(tx, scope, plan.id);
    return edit({ tx, plan, venue, objects });
  });
}

export function labelList(objects: readonly PlacedObject[]): string {
  if (objects.length <= 3)
    return objects.map((object) => object.label).join(", ");
  return `${objects.length} objects`;
}

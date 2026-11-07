import { and, eq, inArray } from "drizzle-orm";

import { schema } from "../../db/index.js";
import type { Scope } from "../scope.js";
import { assertUnlocked, findById, recordChange } from "./commit.js";
import { labelList, withPlan } from "./edit.js";

export function removeObjects(
  scope: Scope,
  input: { planId: string; expectedVersion: number; objectIds: string[] },
) {
  return withPlan(scope, input, async ({ tx, plan, objects }) => {
    const targets = findById(objects, input.objectIds);
    assertUnlocked(targets);
    const { placedObjects } = schema;
    await tx
      .delete(placedObjects)
      .where(
        and(
          inArray(placedObjects.id, input.objectIds),
          eq(placedObjects.planId, plan.id),
          eq(placedObjects.ownerEmail, scope.ownerEmail),
        ),
      );
    const version = await recordChange(tx, scope, plan, {
      action: "remove-objects",
      summary: `Removed ${labelList(targets)}`,
      payload: { objectIds: input.objectIds },
    });
    return { planId: plan.id, version, removedIds: input.objectIds };
  });
}

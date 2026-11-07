import { and, eq, inArray } from "drizzle-orm";

import { schema } from "../../db/index.js";
import type { Scope } from "../scope.js";
import { findById, recordChange } from "./commit.js";
import { labelList, withPlan } from "./edit.js";

export function setLocked(
  scope: Scope,
  input: {
    planId: string;
    expectedVersion: number;
    objectIds: string[];
    locked: boolean;
  },
) {
  return withPlan(scope, input, async ({ tx, plan, objects }) => {
    const changing = findById(objects, input.objectIds).filter(
      (object) => object.locked !== input.locked,
    );
    if (changing.length === 0) {
      return { planId: plan.id, version: plan.version, objects: [] };
    }
    const ids = changing.map((object) => object.id);
    const { placedObjects } = schema;
    await tx
      .update(placedObjects)
      .set({ locked: input.locked })
      .where(
        and(
          inArray(placedObjects.id, ids),
          eq(placedObjects.planId, plan.id),
          eq(placedObjects.ownerEmail, scope.ownerEmail),
        ),
      );
    const version = await recordChange(tx, scope, plan, {
      action: "lock-objects",
      summary: `${input.locked ? "Locked" : "Unlocked"} ${labelList(changing)}`,
      payload: { objectIds: ids, locked: input.locked },
    });
    return {
      planId: plan.id,
      version,
      objects: changing.map((object) => ({ ...object, locked: input.locked })),
    };
  });
}

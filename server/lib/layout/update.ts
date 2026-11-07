import { and, eq } from "drizzle-orm";

import type { PlacedObject } from "../../../shared/contracts/layout.js";
import type { Rotation } from "../../../shared/geometry/index.js";
import { schema } from "../../db/index.js";
import type { Scope } from "../scope.js";
import {
  assertPlaceable,
  assertUnlocked,
  findById,
  recordChange,
} from "./commit.js";
import { withPlan } from "./edit.js";

export type ObjectPatch = {
  label?: string | undefined;
  widthMm?: number | undefined;
  heightMm?: number | undefined;
  rotationDeg?: Rotation | undefined;
  capacity?: number | undefined;
  unitCostCents?: number | undefined;
};

const GEOMETRY_FIELDS = ["widthMm", "heightMm", "rotationDeg"] as const;

function changedFields(object: PlacedObject, patch: ObjectPatch) {
  return (Object.keys(patch) as (keyof ObjectPatch)[]).filter(
    (field) => patch[field] !== undefined && patch[field] !== object[field],
  );
}

export function updateObject(
  scope: Scope,
  input: {
    planId: string;
    expectedVersion: number;
    objectId: string;
    patch: ObjectPatch;
  },
) {
  return withPlan(scope, input, async ({ tx, plan, venue, objects }) => {
    const [current] = findById(objects, [input.objectId]);
    const fields = changedFields(current!, input.patch);
    if (fields.length === 0) {
      return { planId: plan.id, version: plan.version, objects: [current!] };
    }
    const patch = Object.fromEntries(
      fields.map((field) => [field, input.patch[field]]),
    ) as Partial<PlacedObject>;
    const updated: PlacedObject = { ...current!, ...patch };
    const geometryChanged = fields.some((field) =>
      (GEOMETRY_FIELDS as readonly string[]).includes(field),
    );
    if (geometryChanged) {
      assertUnlocked([current!]);
      const next = objects.map((object) =>
        object.id === updated.id ? updated : object,
      );
      assertPlaceable(venue, next, new Set([updated.id]));
    }
    const { placedObjects } = schema;
    await tx
      .update(placedObjects)
      .set(patch)
      .where(
        and(
          eq(placedObjects.id, updated.id),
          eq(placedObjects.planId, plan.id),
          eq(placedObjects.ownerEmail, scope.ownerEmail),
        ),
      );
    const version = await recordChange(tx, scope, plan, {
      action: "update-object",
      summary: `Changed ${fields.join(", ")} of ${updated.label}`,
      payload: { objectId: updated.id, patch },
    });
    return { planId: plan.id, version, objects: [updated] };
  });
}

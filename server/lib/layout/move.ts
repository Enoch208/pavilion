import { and, eq } from "drizzle-orm";

import { schema } from "../../db/index.js";
import type { Scope } from "../scope.js";
import {
  assertPlaceable,
  assertUnlocked,
  findById,
  recordChange,
} from "./commit.js";
import { labelList, withPlan } from "./edit.js";

export type MoveRequest = { objectId: string; xMm: number; yMm: number };

export function moveObjects(
  scope: Scope,
  input: { planId: string; expectedVersion: number; moves: MoveRequest[] },
) {
  return withPlan(scope, input, async ({ tx, plan, venue, objects }) => {
    const ids = input.moves.map((move) => move.objectId);
    assertUnlocked(findById(objects, ids));
    const targets = new Map(input.moves.map((move) => [move.objectId, move]));
    const next = objects.map((object) => {
      const move = targets.get(object.id);
      return move ? { ...object, xMm: move.xMm, yMm: move.yMm } : object;
    });
    assertPlaceable(venue, next, new Set(ids));
    const { placedObjects } = schema;
    for (const move of input.moves) {
      await tx
        .update(placedObjects)
        .set({ xMm: move.xMm, yMm: move.yMm })
        .where(
          and(
            eq(placedObjects.id, move.objectId),
            eq(placedObjects.planId, plan.id),
            eq(placedObjects.ownerEmail, scope.ownerEmail),
          ),
        );
    }
    const moved = next.filter((object) => targets.has(object.id));
    const version = await recordChange(tx, scope, plan, {
      action: "move-objects",
      summary: `Moved ${labelList(moved)}`,
      payload: { moves: input.moves },
    });
    return { planId: plan.id, version, objects: moved };
  });
}

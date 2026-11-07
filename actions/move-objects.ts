import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { pavilionErrors } from "../server/lib/errors.js";
import { moveObjects } from "../server/lib/layout/move.js";
import { requireScope } from "../server/lib/scope.js";
import { PlanRef, PositionMm } from "../shared/contracts/inputs.js";

const Move = z.object({
  objectId: z
    .string()
    .min(1)
    .max(64)
    .describe("Placed object id from get-layout or view-screen"),
  xMm: PositionMm.describe("New left edge in millimetres from the west wall"),
  yMm: PositionMm.describe("New top edge in millimetres from the north wall"),
});

export default defineAction({
  description:
    "Move one or more placed objects to new positions in one change. Locked objects are refused with OBJECT_LOCKED. A move that leaves the venue or overlaps a solid object or exit is refused with LAYOUT_INVALID and nothing is saved.",
  schema: z.object({
    ...PlanRef,
    moves: z
      .array(Move)
      .min(1)
      .max(500)
      .refine(
        (moves) =>
          new Set(moves.map((move) => move.objectId)).size === moves.length,
        {
          message: "Each object may appear once.",
        },
      )
      .describe("Target positions"),
  }),
  errors: pavilionErrors,
  run: async (args, ctx) => moveObjects(requireScope(ctx), args),
});

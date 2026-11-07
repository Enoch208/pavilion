import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { pavilionErrors } from "../server/lib/errors.js";
import { addObjects } from "../server/lib/layout/add.js";
import { requireScope } from "../server/lib/scope.js";
import {
  PlanRef,
  PositionMm,
  RotationInput,
} from "../shared/contracts/inputs.js";

const AddRequest = z
  .object({
    catalogItemId: z
      .string()
      .min(1)
      .max(64)
      .describe("Catalog item id from get-catalog"),
    xMm: PositionMm.optional().describe(
      "Left edge in millimetres from the west wall. Omit with yMm to let the engine pick the free spot nearest the centre.",
    ),
    yMm: PositionMm.optional().describe(
      "Top edge in millimetres from the north wall",
    ),
    rotationDeg: RotationInput.optional().describe(
      "0, 90, 180 or 270; default 0",
    ),
    label: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .optional()
      .describe("Display name; defaults to the item name and a number"),
  })
  .refine(
    (request) => (request.xMm === undefined) === (request.yMm === undefined),
    {
      message: "Give both xMm and yMm, or neither.",
    },
  );

export default defineAction({
  description:
    "Place one or more catalog items on the floor plan in one change. Refused with LAYOUT_INVALID if any would leave the venue or overlap a solid object or exit; nothing is saved then. Report the conflict instead of guessing new positions.",
  schema: z.object({
    ...PlanRef,
    objects: z.array(AddRequest).min(1).max(200).describe("Items to place"),
  }),
  errors: pavilionErrors,
  run: async (args, ctx) => addObjects(requireScope(ctx), args),
});

import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { pavilionErrors } from "../server/lib/errors.js";
import { updateObject } from "../server/lib/layout/update.js";
import { requireScope } from "../server/lib/scope.js";
import { PlanRef, RotationInput } from "../shared/contracts/inputs.js";

const Size = z.coerce.number().int().min(250).max(100_000);

export default defineAction({
  description:
    "Change one placed object's label, size, rotation, seats or unit cost. Size and rotation are refused on a locked object and re-checked against the walls and other objects. Set a unit cost only to a figure the user stated.",
  schema: z.object({
    ...PlanRef,
    objectId: z.string().min(1).max(64).describe("Placed object id"),
    patch: z
      .object({
        label: z
          .string()
          .trim()
          .min(1)
          .max(80)
          .optional()
          .describe("Display name"),
        widthMm: Size.optional().describe(
          "Width in millimetres before rotation",
        ),
        heightMm: Size.optional().describe(
          "Depth in millimetres before rotation",
        ),
        rotationDeg: RotationInput.optional().describe("0, 90, 180 or 270"),
        capacity: z.coerce
          .number()
          .int()
          .min(0)
          .max(1_000)
          .optional()
          .describe("Seats this object provides"),
        unitCostCents: z.coerce
          .number()
          .int()
          .min(0)
          .max(100_000_000)
          .optional()
          .describe("Unit cost in cents"),
      })
      .refine(
        (patch) => Object.values(patch).some((value) => value !== undefined),
        {
          message: "Change at least one field.",
        },
      )
      .describe("Fields to change"),
  }),
  errors: pavilionErrors,
  run: async (args, ctx) => updateObject(requireScope(ctx), args),
});

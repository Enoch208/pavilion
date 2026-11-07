import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { pavilionErrors } from "../server/lib/errors.js";
import { setLocked } from "../server/lib/layout/lock.js";
import { requireScope } from "../server/lib/scope.js";
import { ObjectIds, PlanRef } from "../shared/contracts/inputs.js";

export default defineAction({
  description:
    "Lock or unlock placed objects. A locked object keeps its position, size and rotation: moves, resizes and removals are refused until it is unlocked. Only unlock when the user asks.",
  schema: z.object({
    ...PlanRef,
    objectIds: ObjectIds.describe("Placed object ids"),
    locked: z
      .union([
        z.boolean(),
        z.enum(["true", "false"]).transform((value) => value === "true"),
      ])
      .describe("true to lock, false to unlock"),
  }),
  errors: pavilionErrors,
  run: async (args, ctx) => setLocked(requireScope(ctx), args),
});

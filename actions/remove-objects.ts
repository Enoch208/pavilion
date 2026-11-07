import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { pavilionErrors } from "../server/lib/errors.js";
import { removeObjects } from "../server/lib/layout/remove.js";
import { requireScope } from "../server/lib/scope.js";
import { ObjectIds, PlanRef } from "../shared/contracts/inputs.js";

export default defineAction({
  description:
    "Remove placed objects from the floor plan in one change. Locked objects are refused with OBJECT_LOCKED and nothing is removed.",
  schema: z.object({
    ...PlanRef,
    objectIds: ObjectIds.describe("Placed object ids to remove"),
  }),
  errors: pavilionErrors,
  run: async (args, ctx) => removeObjects(requireScope(ctx), args),
});

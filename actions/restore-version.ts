import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { pavilionErrors, reject } from "../server/lib/errors.js";
import { requireScope } from "../server/lib/scope.js";
import { restoreVersion } from "../server/lib/versions/restore.js";
import { PlanRef } from "../shared/contracts/inputs.js";

export default defineAction({
  description:
    "Restore a saved layout. Only a person can do this, in the app. The current layout is saved first, so the restore can itself be undone.",
  schema: z.object({
    versionId: z
      .string()
      .min(1)
      .max(64)
      .describe("Saved version id from list-versions"),
    expectedVersion: PlanRef.expectedVersion,
  }),
  errors: pavilionErrors,
  uiOnly: true,
  agentTool: false,
  mcpTool: false,
  toolCallable: false,
  run: async (args, ctx) => {
    if (ctx?.caller !== "frontend") {
      reject(
        "HUMAN_ONLY",
        "Only a person can restore a saved layout, from the floor plan in the app.",
        { caller: ctx?.caller ?? null },
      );
    }
    return restoreVersion(requireScope(ctx), args);
  },
});

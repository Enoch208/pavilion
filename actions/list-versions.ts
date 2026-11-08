import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { pavilionErrors } from "../server/lib/errors.js";
import { requireScope } from "../server/lib/scope.js";
import { listVersions } from "../server/lib/versions/history.js";

export default defineAction({
  description:
    "List the saved layouts of a plan, newest first: the seeded layout and the layouts before and after each applied proposal or restore, with seats and cost. Only a person can restore one, in the app.",
  schema: z.object({
    planId: z
      .string()
      .min(1)
      .max(64)
      .describe("Layout plan id from get-layout"),
  }),
  errors: pavilionErrors,
  http: { method: "GET" },
  readOnly: true,
  run: async ({ planId }, ctx) => listVersions(requireScope(ctx), planId),
});

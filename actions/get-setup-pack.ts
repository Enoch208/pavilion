import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { pavilionErrors } from "../server/lib/errors.js";
import { requireSetupPack } from "../server/lib/exports/records.js";
import { requireScope } from "../server/lib/scope.js";
import { SetupPackRecord } from "../shared/contracts/export.js";

export default defineAction({
  description:
    "Read a setup pack exported earlier: the frozen event, venue, plan version and every placed object it was made from.",
  schema: z.object({
    packId: z
      .string()
      .min(1)
      .max(64)
      .describe("Setup pack id from export-setup-pack"),
  }),
  outputSchema: SetupPackRecord,
  errors: pavilionErrors,
  http: { method: "GET" },
  readOnly: true,
  run: async ({ packId }, ctx) => requireSetupPack(requireScope(ctx), packId),
});

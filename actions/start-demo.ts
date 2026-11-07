import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { ensureDemoEvent } from "../server/lib/demo/seed.js";
import { pavilionErrors } from "../server/lib/errors.js";
import { requireScope } from "../server/lib/scope.js";

export default defineAction({
  description:
    "Create the caller's own copy of the Nova Product Launch demo event, or return the existing one.",
  schema: z.object({}),
  errors: pavilionErrors,
  agentTool: false,
  run: async (_args, ctx) => ensureDemoEvent(requireScope(ctx)),
});

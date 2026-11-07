import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { resetDemoEvent } from "../server/lib/demo/seed.js";
import { pavilionErrors } from "../server/lib/errors.js";
import { requireScope } from "../server/lib/scope.js";

export default defineAction({
  description:
    "Restore the caller's Nova Product Launch demo to its seeded layout. The plan version moves forward, so older reads are refused.",
  schema: z.object({}),
  errors: pavilionErrors,
  agentTool: false,
  run: async (_args, ctx) => resetDemoEvent(requireScope(ctx)),
});

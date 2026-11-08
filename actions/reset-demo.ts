import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { resetDemoEvent } from "../server/lib/demo/seed.js";
import { pavilionErrors, reject } from "../server/lib/errors.js";
import {
  DEMO_RESET_RULE,
  takeRateSlot,
} from "../server/lib/guests/rate-limit.js";
import { requireScope } from "../server/lib/scope.js";

export default defineAction({
  description:
    "Restore the caller's Nova Product Launch demo to its seeded layout. The plan version moves forward, so older reads are refused.",
  schema: z.object({}),
  errors: pavilionErrors,
  agentTool: false,
  run: async (_args, ctx) => {
    const scope = requireScope(ctx);
    const slot = await takeRateSlot(DEMO_RESET_RULE, scope.ownerEmail);
    if (!slot.allowed) {
      reject(
        "RATE_LIMITED",
        `The demo can be reset ${slot.limit} times an hour. Try again later.`,
        { limit: slot.limit, retryAfterSeconds: slot.retryAfterSeconds },
      );
    }
    return resetDemoEvent(scope);
  },
});

import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { pavilionErrors } from "../server/lib/errors.js";
import { proposeLayout } from "../server/lib/proposals/propose.js";
import { requireScope } from "../server/lib/scope.js";
import { ProposalView } from "../shared/contracts/proposal.js";

export default defineAction({
  description:
    "Ask the deterministic planner for a new seating arrangement and save it as a proposal for the person to review. Nothing on the floor plan changes. The planner keeps every locked and non-seating object in place and keeps seats at least the minimum aisle from walls and fixed objects; it reports a shortfall rather than breaking those rules. Only a person can apply the proposal, in the app.",
  schema: z.object({
    planId: z
      .string()
      .min(1)
      .max(64)
      .describe("Layout plan id from get-layout or view-screen"),
    mode: z
      .enum(["theatre"])
      .optional()
      .describe("Seating style; theatre rows"),
    attendeeTarget: z.coerce
      .number()
      .int()
      .min(0)
      .max(5_000)
      .optional()
      .describe("Guests to seat; defaults to the event's current target"),
    minAisleMm: z.coerce
      .number()
      .int()
      .min(600)
      .max(5_000)
      .optional()
      .describe(
        "Minimum clearance in millimetres around walls, fixed objects and between blocks; defaults to the plan's (1200)",
      ),
  }),
  outputSchema: ProposalView,
  errors: pavilionErrors,
  run: async (args, ctx) => proposeLayout(requireScope(ctx), args),
});

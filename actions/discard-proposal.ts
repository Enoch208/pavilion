import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { pavilionErrors } from "../server/lib/errors.js";
import { discardProposal } from "../server/lib/proposals/apply.js";
import { requireScope } from "../server/lib/scope.js";

export default defineAction({
  description:
    "Discard a pending proposal. The floor plan is unchanged. Use when the person rejects it or asks for something else.",
  schema: z.object({
    proposalId: z.string().min(1).max(64).describe("Proposal id"),
  }),
  errors: pavilionErrors,
  run: async ({ proposalId }, ctx) =>
    discardProposal(requireScope(ctx), proposalId),
});

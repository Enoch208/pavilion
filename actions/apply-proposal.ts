import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { pavilionErrors, reject } from "../server/lib/errors.js";
import { applyProposal } from "../server/lib/proposals/apply.js";
import { requireScope } from "../server/lib/scope.js";

export default defineAction({
  description:
    "Apply a pending proposal to the floor plan. Only a person can do this, in the app. Refused if the plan changed since the proposal was made.",
  schema: z.object({
    proposalId: z.string().min(1).max(64).describe("Proposal id"),
  }),
  errors: pavilionErrors,
  uiOnly: true,
  agentTool: false,
  mcpTool: false,
  toolCallable: false,
  run: async ({ proposalId }, ctx) => {
    if (ctx?.caller !== "frontend") {
      reject(
        "HUMAN_ONLY",
        "Only a person can apply a proposal, from the floor plan in the app.",
        { caller: ctx?.caller ?? null },
      );
    }
    return applyProposal(requireScope(ctx), proposalId);
  },
});

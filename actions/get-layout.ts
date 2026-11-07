import { defineAction } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { z } from "zod";

import { pavilionErrors } from "../server/lib/errors.js";
import { buildLayoutView } from "../server/lib/layout/view.js";
import { requireScope } from "../server/lib/scope.js";
import { LayoutView } from "../shared/contracts/layout.js";

export default defineAction({
  description:
    "Read an event's floor plan: venue size, plan id and version, every placed object (millimetres, top-left origin, rotation in degrees), modelled seats, cost against budget, and any boundary or overlap issues. Call before editing; pass plan.version as expectedVersion.",
  schema: z.object({
    eventId: z
      .string()
      .min(1)
      .max(64)
      .describe("Event id from list-events or navigation"),
  }),
  outputSchema: LayoutView,
  errors: pavilionErrors,
  http: { method: "GET" },
  readOnly: true,
  link: ({ args }) => ({
    url: buildDeepLink({
      view: "event",
      to: `/events/${encodeURIComponent(args.eventId)}`,
      params: { eventId: args.eventId },
    }),
    label: "Open the floor plan",
  }),
  run: async ({ eventId }, ctx) => buildLayoutView(requireScope(ctx), eventId),
});

import { defineAction } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { z } from "zod";

import { pavilionErrors } from "../server/lib/errors.js";
import { exportSetupPack } from "../server/lib/exports/create.js";
import { requireScope } from "../server/lib/scope.js";

const ExportedPack = z.object({
  packId: z.string(),
  eventId: z.string(),
  path: z.string(),
});

export default defineAction({
  description:
    "Freeze the current floor plan into a setup pack a crew can work from: a scaled floor plan (SVG or PNG), the item list with sizes, quantities and example prices, seating rows and placements, as a printable page. The plan does not change. Returns the pack id, its path in the app and the item list; tell the person where to open it.",
  schema: z.object({
    planId: z
      .string()
      .min(1)
      .max(64)
      .describe("Layout plan id from get-layout or view-screen"),
    expectedVersion: z.coerce
      .number()
      .int()
      .min(0)
      .optional()
      .describe(
        "Plan version the person is looking at; the export is refused if the plan has changed since",
      ),
  }),
  errors: pavilionErrors,
  link: ({ result }) => {
    const parsed = ExportedPack.safeParse(result);
    if (!parsed.success) return null;
    return {
      url: buildDeepLink({
        view: "pack",
        to: parsed.data.path,
        params: { eventId: parsed.data.eventId, packId: parsed.data.packId },
      }),
      label: "Open the setup pack",
    };
  },
  run: async (args, ctx) => exportSetupPack(requireScope(ctx), args),
});

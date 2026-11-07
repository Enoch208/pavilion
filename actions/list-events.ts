import { defineAction } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { pavilionErrors } from "../server/lib/errors.js";
import { requireScope } from "../server/lib/scope.js";

export default defineAction({
  description: "List the events the current user is planning, newest first.",
  schema: z.object({}),
  errors: pavilionErrors,
  http: { method: "GET" },
  readOnly: true,
  link: () => ({
    url: buildDeepLink({ view: "events", to: "/events" }),
    label: "Open events",
  }),
  run: async (_args, ctx) => {
    const scope = requireScope(ctx);
    const { events } = schema;
    const rows = await getDb()
      .select({
        id: events.id,
        title: events.title,
        eventType: events.eventType,
        attendeeTarget: events.attendeeTarget,
        budgetCents: events.budgetCents,
        currency: events.currency,
        demoKey: events.demoKey,
      })
      .from(events)
      .where(eq(events.ownerEmail, scope.ownerEmail))
      .orderBy(desc(events.createdAt))
      .limit(50);
    return {
      events: rows.map(({ demoKey, ...event }) => ({
        ...event,
        isDemo: demoKey !== null,
      })),
    };
  },
});

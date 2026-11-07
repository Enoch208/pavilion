import { defineAction } from "@agent-native/core/action";
import { readAppStateForCurrentTab } from "@agent-native/core/application-state";
import { z } from "zod";

import { findLayoutView } from "../server/lib/layout/view.js";
import { actorFor } from "../server/lib/scope.js";

const MAX_SELECTION = 500;

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= 64
    ? value
    : null;
}

function selectedIds(selection: Record<string, unknown> | null): string[] {
  const ids = selection?.objectIds;
  if (!Array.isArray(ids)) return [];
  return ids
    .map(text)
    .filter((id): id is string => id !== null)
    .slice(0, MAX_SELECTION);
}

export default defineAction({
  description:
    "Fresh read of what the user is looking at: navigation, the open event and plan (id, version, seats, cost, issue count) and the objects they have selected, verified against the database. Call before acting on 'this', 'these' or 'the selected' objects.",
  schema: z.object({}),
  http: false,
  readOnly: true,
  run: async (_args, ctx) => {
    const navigation = await readAppStateForCurrentTab("navigation", {
      fallbackToGlobal: true,
    });
    const selection = await readAppStateForCurrentTab("selection");
    const ownerEmail = ctx?.userEmail?.trim().toLowerCase();
    const eventId = text(navigation?.eventId);
    const layout =
      ownerEmail && eventId
        ? await findLayoutView(
            { ownerEmail, actor: actorFor(ctx?.caller) },
            eventId,
          )
        : null;
    const ids = selectedIds(selection);
    const byId = new Map(layout?.objects.map((object) => [object.id, object]));
    return {
      navigation: navigation ?? null,
      event: layout
        ? {
            eventId: layout.event.id,
            title: layout.event.title,
            planId: layout.plan.id,
            version: layout.plan.version,
            mode: layout.plan.mode,
            venue: layout.venue,
            objectCount: layout.objects.length,
            summary: layout.summary,
            issueCount: layout.issues.length,
          }
        : null,
      selection: {
        objects: ids
          .filter((id) => byId.has(id))
          .map((id) => {
            const object = byId.get(id)!;
            return {
              id: object.id,
              label: object.label,
              kind: object.kind,
              xMm: object.xMm,
              yMm: object.yMm,
              locked: object.locked,
            };
          }),
        unresolvedIds: ids.filter((id) => !byId.has(id)),
      },
    };
  },
});

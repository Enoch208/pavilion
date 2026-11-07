import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import type { PlacedObject } from "../../../shared/contracts/layout.js";
import { schema, type Tx } from "../../db/index.js";
import type { Scope } from "../scope.js";

export type LayoutState = {
  objects: PlacedObject[];
  attendeeTarget: number;
  mode: "theatre" | "banquet" | "workshop" | "exhibition";
  minAisleMm: number;
};

export async function replaceObjects(
  tx: Tx,
  scope: Scope,
  planId: string,
  objects: readonly PlacedObject[],
) {
  const { placedObjects } = schema;
  await tx
    .delete(placedObjects)
    .where(
      and(
        eq(placedObjects.planId, planId),
        eq(placedObjects.ownerEmail, scope.ownerEmail),
      ),
    );
  if (objects.length === 0) return;
  await tx.insert(placedObjects).values(
    objects.map((object) => ({
      ...object,
      planId,
      ownerEmail: scope.ownerEmail,
    })),
  );
}

export async function applyRequirements(
  tx: Tx,
  scope: Scope,
  ids: { planId: string; eventId: string },
  state: Omit<LayoutState, "objects">,
) {
  const { events, layoutPlans } = schema;
  await tx
    .update(events)
    .set({ attendeeTarget: state.attendeeTarget, updatedAt: new Date() })
    .where(
      and(eq(events.id, ids.eventId), eq(events.ownerEmail, scope.ownerEmail)),
    );
  await tx
    .update(layoutPlans)
    .set({ mode: state.mode, minAisleMm: state.minAisleMm })
    .where(
      and(
        eq(layoutPlans.id, ids.planId),
        eq(layoutPlans.ownerEmail, scope.ownerEmail),
      ),
    );
}

export async function saveVersion(
  tx: Tx,
  scope: Scope,
  input: {
    planId: string;
    version: number;
    reason: string;
    state: LayoutState;
  },
) {
  await tx.insert(schema.layoutVersions).values({
    id: randomUUID(),
    planId: input.planId,
    ownerEmail: scope.ownerEmail,
    version: input.version,
    reason: input.reason,
    objects: input.state.objects,
    attendeeTarget: input.state.attendeeTarget,
    mode: input.state.mode,
    minAisleMm: input.state.minAisleMm,
  });
}

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { NOVA, novaObjects } from "../../../shared/demo/nova.js";
import { getDb, schema, type Tx } from "../../db/index.js";
import { reject } from "../errors.js";
import { recordChange } from "../layout/commit.js";
import { loadObjects, requirePlan } from "../layout/load.js";
import type { PlanRow } from "../layout/records.js";
import { saveVersion } from "../layout/snapshot.js";
import type { Scope } from "../scope.js";

async function findDemoEvent(db: Tx | ReturnType<typeof getDb>, scope: Scope) {
  const { events, layoutPlans } = schema;
  const [row] = await db
    .select({ eventId: events.id, planId: layoutPlans.id })
    .from(events)
    .innerJoin(layoutPlans, eq(layoutPlans.eventId, events.id))
    .where(
      and(
        eq(events.ownerEmail, scope.ownerEmail),
        eq(events.demoKey, NOVA.demoKey),
      ),
    );
  return row ?? null;
}

async function placeSeedObjects(tx: Tx, scope: Scope, plan: PlanRow) {
  const objects = novaObjects().map((object) => ({
    ...object,
    id: randomUUID(),
    planId: plan.id,
    ownerEmail: scope.ownerEmail,
  }));
  await tx.insert(schema.placedObjects).values(objects);
  return objects.length;
}

async function saveSeedVersion(
  tx: Tx,
  scope: Scope,
  planId: string,
  version: number,
) {
  await saveVersion(tx, scope, {
    planId,
    version,
    reason: "Seeded layout",
    state: {
      objects: await loadObjects(tx, scope, planId),
      attendeeTarget: NOVA.attendeeTarget,
      mode: NOVA.mode,
      minAisleMm: NOVA.minAisleMm,
    },
  });
}

export async function ensureDemoEvent(scope: Scope) {
  const existing = await findDemoEvent(getDb(), scope);
  if (existing) return { eventId: existing.eventId, created: false };
  return getDb().transaction(async (tx) => {
    const eventId = randomUUID();
    const inserted = await tx
      .insert(schema.events)
      .values({
        id: eventId,
        ownerEmail: scope.ownerEmail,
        demoKey: NOVA.demoKey,
        title: NOVA.title,
        eventType: NOVA.eventType,
        attendeeTarget: NOVA.attendeeTarget,
        currency: NOVA.currency,
        budgetCents: NOVA.budgetCents,
      })
      .onConflictDoNothing()
      .returning({ id: schema.events.id });
    if (inserted.length === 0) {
      const raced = await findDemoEvent(tx, scope);
      if (!raced) reject("NOT_FOUND", "The demo event could not be created.");
      return { eventId: raced.eventId, created: false };
    }
    await tx.insert(schema.venues).values({
      id: randomUUID(),
      eventId,
      ownerEmail: scope.ownerEmail,
      ...NOVA.venue,
    });
    const [plan] = await tx
      .insert(schema.layoutPlans)
      .values({
        id: randomUUID(),
        eventId,
        ownerEmail: scope.ownerEmail,
        mode: NOVA.mode,
      })
      .returning();
    const count = await placeSeedObjects(tx, scope, plan!);
    const version = await recordChange(tx, scope, plan!, {
      action: "start-demo",
      summary: `Seeded ${NOVA.title} with ${count} objects`,
      payload: { demoKey: NOVA.demoKey },
    });
    await saveSeedVersion(tx, scope, plan!.id, version);
    return { eventId, created: true };
  });
}

export async function resetDemoEvent(scope: Scope) {
  const existing = await findDemoEvent(getDb(), scope);
  if (!existing) return ensureDemoEvent(scope);
  return getDb().transaction(async (tx) => {
    const { plan } = await requirePlan(tx, scope, existing.planId);
    const { events, placedObjects } = schema;
    await tx
      .delete(placedObjects)
      .where(
        and(
          eq(placedObjects.planId, plan.id),
          eq(placedObjects.ownerEmail, scope.ownerEmail),
        ),
      );
    await tx
      .update(events)
      .set({
        title: NOVA.title,
        attendeeTarget: NOVA.attendeeTarget,
        budgetCents: NOVA.budgetCents,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(events.id, existing.eventId),
          eq(events.ownerEmail, scope.ownerEmail),
        ),
      );
    const count = await placeSeedObjects(tx, scope, plan);
    await tx
      .update(schema.layoutPlans)
      .set({ mode: NOVA.mode, minAisleMm: NOVA.minAisleMm })
      .where(
        and(
          eq(schema.layoutPlans.id, plan.id),
          eq(schema.layoutPlans.ownerEmail, scope.ownerEmail),
        ),
      );
    const version = await recordChange(tx, scope, plan, {
      action: "reset-demo",
      summary: `Reset ${NOVA.title} to its ${count} seeded objects`,
      payload: { demoKey: NOVA.demoKey },
    });
    await saveSeedVersion(tx, scope, plan.id, version);
    return { eventId: existing.eventId, created: false };
  });
}

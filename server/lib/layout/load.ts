import { and, asc, eq } from "drizzle-orm";

import { getDb, schema, type DbLike } from "../../db/index.js";
import { reject } from "../errors.js";
import type { Scope } from "../scope.js";
import { toPlacedObject, type PlanRow, type VenueRow } from "./records.js";

const MAX_OBJECTS = 2_000;

export async function requirePlan(
  db: DbLike,
  scope: Scope,
  planId: string,
  options: { lock: boolean } = { lock: true },
): Promise<{ plan: PlanRow; venue: VenueRow }> {
  const { layoutPlans, venues } = schema;
  const query = db
    .select()
    .from(layoutPlans)
    .where(
      and(
        eq(layoutPlans.id, planId),
        eq(layoutPlans.ownerEmail, scope.ownerEmail),
      ),
    );
  const [plan] = options.lock ? await query.for("update") : await query;
  if (!plan) reject("NOT_FOUND", "That layout plan does not exist.");
  const [venue] = await db
    .select()
    .from(venues)
    .where(
      and(
        eq(venues.eventId, plan.eventId),
        eq(venues.ownerEmail, scope.ownerEmail),
      ),
    );
  if (!venue) reject("NOT_FOUND", "That event has no venue.");
  return { plan, venue };
}

export async function loadObjects(db: DbLike, scope: Scope, planId: string) {
  const { placedObjects } = schema;
  const rows = await db
    .select()
    .from(placedObjects)
    .where(
      and(
        eq(placedObjects.planId, planId),
        eq(placedObjects.ownerEmail, scope.ownerEmail),
      ),
    )
    .orderBy(asc(placedObjects.createdAt), asc(placedObjects.id))
    .limit(MAX_OBJECTS);
  return rows.map(toPlacedObject);
}

export async function findEvent(scope: Scope, eventId: string) {
  const db = getDb();
  const { events, venues, layoutPlans } = schema;
  const [row] = await db
    .select({ event: events, venue: venues, plan: layoutPlans })
    .from(events)
    .innerJoin(venues, eq(venues.eventId, events.id))
    .innerJoin(layoutPlans, eq(layoutPlans.eventId, events.id))
    .where(
      and(eq(events.id, eventId), eq(events.ownerEmail, scope.ownerEmail)),
    );
  return row ?? null;
}

export async function requireEventRow(
  db: DbLike,
  scope: Scope,
  eventId: string,
) {
  const { events } = schema;
  const [event] = await db
    .select()
    .from(events)
    .where(
      and(eq(events.id, eventId), eq(events.ownerEmail, scope.ownerEmail)),
    );
  if (!event) reject("NOT_FOUND", "That event does not exist.");
  return event;
}

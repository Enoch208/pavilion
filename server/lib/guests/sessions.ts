import { randomUUID } from "node:crypto";

import { inArray, lt } from "drizzle-orm";

import { GUEST_EMAIL_DOMAIN, GUEST_TTL_HOURS } from "../../../shared/guest.js";
import { getDb, schema } from "../../db/index.js";

const CLEANUP_BATCH = 20;

export function newGuestEmail(): string {
  return `guest-${randomUUID()}@${GUEST_EMAIL_DOMAIN}`;
}

export function guestExpiry(now = new Date()): Date {
  return new Date(now.getTime() + GUEST_TTL_HOURS * 3_600_000);
}

export async function recordGuestSession(input: {
  ownerEmail: string;
  ipHash: string;
  expiresAt: Date;
}) {
  await getDb().insert(schema.guestSessions).values({
    id: randomUUID(),
    ownerEmail: input.ownerEmail,
    ipHash: input.ipHash,
    expiresAt: input.expiresAt,
  });
}

export async function removeExpiredGuests(now = new Date()): Promise<number> {
  const { guestSessions, events } = schema;
  return getDb().transaction(async (tx) => {
    const expired = await tx
      .select({ id: guestSessions.id, ownerEmail: guestSessions.ownerEmail })
      .from(guestSessions)
      .where(lt(guestSessions.expiresAt, now))
      .limit(CLEANUP_BATCH);
    if (expired.length === 0) return 0;
    await tx.delete(events).where(
      inArray(
        events.ownerEmail,
        expired.map((guest) => guest.ownerEmail),
      ),
    );
    await tx.delete(guestSessions).where(
      inArray(
        guestSessions.id,
        expired.map((guest) => guest.id),
      ),
    );
    return expired.length;
  });
}

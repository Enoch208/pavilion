import { createHash, randomUUID } from "node:crypto";

import { and, count, eq, gt, lt, sql } from "drizzle-orm";

import { getDb, schema } from "../../db/index.js";

export type RateRule = {
  bucket: string;
  perKey: number | null;
  global: number | null;
  windowMs: number;
};

export type RateDecision =
  | { allowed: true }
  | {
      allowed: false;
      scope: "key" | "global";
      limit: number;
      retryAfterSeconds: number;
    };

const HOUR_MS = 3_600_000;
const KEEP_MS = 7 * 24 * HOUR_MS;

export const GUEST_START_RULE: RateRule = {
  bucket: "guest_start",
  perKey: 30,
  global: 300,
  windowMs: HOUR_MS,
};
export const DEMO_RESET_RULE: RateRule = {
  bucket: "demo_reset",
  perKey: 30,
  global: null,
  windowMs: HOUR_MS,
};
export const GUEST_TURN_RULE: RateRule = {
  bucket: "guest_turn",
  perKey: 40,
  global: null,
  windowMs: KEEP_MS,
};
export const GUEST_TURN_IP_RULE: RateRule = {
  bucket: "guest_turn_ip",
  perKey: 80,
  global: 1_500,
  windowMs: HOUR_MS,
};

function keyHash(bucket: string, key: string): string {
  return createHash("sha256")
    .update(`pavilion-rate:${bucket}:${key}`)
    .digest("hex");
}

export function takeRateSlot(
  rule: RateRule,
  key: string,
  now = new Date(),
): Promise<RateDecision> {
  const hash = keyHash(rule.bucket, key);
  const since = new Date(now.getTime() - rule.windowMs);
  const retryAfterSeconds = Math.ceil(rule.windowMs / 1_000);
  const { rateEvents } = schema;
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`pv_rate:${rule.bucket}`}))`,
    );
    const inBucket = eq(rateEvents.bucket, rule.bucket);
    const recent = gt(rateEvents.createdAt, since);
    if (rule.perKey !== null) {
      const [row] = await tx
        .select({ n: count() })
        .from(rateEvents)
        .where(and(inBucket, eq(rateEvents.keyHash, hash), recent));
      if ((row?.n ?? 0) >= rule.perKey) {
        return {
          allowed: false,
          scope: "key",
          limit: rule.perKey,
          retryAfterSeconds,
        };
      }
    }
    if (rule.global !== null) {
      const [row] = await tx
        .select({ n: count() })
        .from(rateEvents)
        .where(and(inBucket, recent));
      if ((row?.n ?? 0) >= rule.global) {
        return {
          allowed: false,
          scope: "global",
          limit: rule.global,
          retryAfterSeconds,
        };
      }
    }
    await tx.insert(rateEvents).values({
      id: randomUUID(),
      bucket: rule.bucket,
      keyHash: hash,
      createdAt: now,
    });
    await tx
      .delete(rateEvents)
      .where(
        and(
          inBucket,
          lt(rateEvents.createdAt, new Date(now.getTime() - KEEP_MS)),
        ),
      );
    return { allowed: true };
  });
}

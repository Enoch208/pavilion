import { isGuestBlockedPath, isGuestEmail } from "@shared/guest";
import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getDb } from "../../server/db/index";
import { PAVILION_MIGRATIONS } from "../../server/db/migrations";
import {
  takeRateSlot,
  type RateRule,
} from "../../server/lib/guests/rate-limit";

const RULE: RateRule = {
  bucket: "test",
  perKey: 3,
  global: 5,
  windowMs: 60_000,
};
const NOW = new Date("2026-11-08T10:00:00.000Z");

function rateTableStatements(): string[] {
  const migration = PAVILION_MIGRATIONS.find(
    (entry) => entry.name === "pavilion_guest_sandboxes_v4",
  );
  if (!migration || !("sql" in migration)) throw new Error("missing v4");
  return String(migration.sql)
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.includes("pv_rate_events"));
}

beforeAll(async () => {
  for (const statement of rateTableStatements()) {
    await getDb().execute(sql.raw(statement));
  }
});

beforeEach(async () => {
  await getDb().execute(sql.raw("DELETE FROM pv_rate_events"));
});

describe("rate slots", () => {
  it("allows a key up to its cap, then refuses without recording", async () => {
    const decisions = [];
    for (let index = 0; index < 4; index += 1) {
      decisions.push(await takeRateSlot(RULE, "1.2.3.4", NOW));
    }
    expect(decisions.map((decision) => decision.allowed)).toEqual([
      true,
      true,
      true,
      false,
    ]);
    expect(decisions[3]).toMatchObject({ scope: "key", limit: 3 });
    const rows = await getDb().execute(
      sql.raw("SELECT count(*)::int AS n FROM pv_rate_events"),
    );
    expect(JSON.stringify(rows)).toContain('"n":3');
  });

  it("caps the whole bucket across keys", async () => {
    const keys = ["a", "b", "c", "d", "e", "f"];
    const decisions = [];
    for (const key of keys) decisions.push(await takeRateSlot(RULE, key, NOW));
    expect(decisions.filter((decision) => decision.allowed)).toHaveLength(5);
    expect(decisions[5]).toMatchObject({ allowed: false, scope: "global" });
  });

  it("forgets events older than the window", async () => {
    const earlier = new Date(NOW.getTime() - 61_000);
    for (let index = 0; index < 3; index += 1) {
      await takeRateSlot(RULE, "k", earlier);
    }
    expect(await takeRateSlot(RULE, "k", NOW)).toEqual({ allowed: true });
  });

  it("never lets concurrent requests overshoot the cap", async () => {
    const decisions = await Promise.all(
      Array.from({ length: 8 }, () => takeRateSlot(RULE, "burst", NOW)),
    );
    expect(decisions.filter((decision) => decision.allowed)).toHaveLength(3);
  });
});

describe("guest identities", () => {
  it("recognises only the sandbox domain", () => {
    expect(isGuestEmail("guest-1@guest.pavilion.invalid")).toBe(true);
    expect(isGuestEmail("GUEST-1@GUEST.PAVILION.INVALID")).toBe(true);
    expect(isGuestEmail("someone@guest.pavilion.invalid.example.com")).toBe(
      false,
    );
    expect(isGuestEmail("dev@local.test")).toBe(false);
    expect(isGuestEmail(null)).toBe(false);
  });

  it("keeps guests out of the starter's admin pages but not the planner", () => {
    expect(isGuestBlockedPath("/database")).toBe(true);
    expect(isGuestBlockedPath("/settings/agent")).toBe(true);
    expect(isGuestBlockedPath("/home")).toBe(true);
    expect(isGuestBlockedPath("/events")).toBe(false);
    expect(isGuestBlockedPath("/events/abc/packs/def")).toBe(false);
    expect(isGuestBlockedPath("/chat")).toBe(false);
  });
});

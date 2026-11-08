import type { PlacedObject } from "@shared/contracts/layout";
import { findIssues, footprint, rectsOverlap } from "@shared/geometry";
import { toShape } from "@shared/layout/shape";
import { describe, expect, it } from "vitest";

import { NOVA, novaObjects } from "../../server/lib/demo/nova";
import { BANQUET_CHAIR_RING_MM } from "../../server/lib/planner/context";
import { planLayout } from "../../server/lib/planner/plan";

const venue = NOVA.venue;

function seeded(): PlacedObject[] {
  return novaObjects().map((object, index) => ({
    ...object,
    id: `seed-${index}`,
  }));
}

function banquet(
  attendeeTarget: number,
  objects = seeded(),
  minAisleMm = 1_200,
) {
  let next = 0;
  return planLayout({
    venue,
    objects,
    mode: "banquet",
    attendeeTarget,
    minAisleMm,
    budgetCents: NOVA.budgetCents,
    newId: () => `new-${(next += 1)}`,
  });
}

describe("banquet planner", () => {
  it("replaces unlocked chairs with round tables the engine accepts", () => {
    const result = banquet(24);
    const kinds = new Set(result.objects.map((object) => object.kind));
    expect(kinds.has("chair")).toBe(false);
    expect(kinds.has("round-table")).toBe(true);
    expect(result.report.seatsAfter).toBe(24);
    expect(result.report.removed).toBe(120);
    expect(findIssues(result.objects.map(toShape), venue)).toEqual([]);
  });

  it("keeps room for the chairs around each table and the aisle beyond them", () => {
    const aisle = 1_200;
    const reach = aisle + BANQUET_CHAIR_RING_MM;
    const result = banquet(200);
    const fixed = result.objects.filter(
      (object) => object.kind !== "round-table" && object.kind !== "zone",
    );
    const tables = result.objects.filter(
      (object) => object.kind === "round-table",
    );
    for (const table of tables) {
      const rect = footprint(table);
      expect(rect.x).toBeGreaterThanOrEqual(reach);
      expect(rect.y).toBeGreaterThanOrEqual(reach);
      expect(rect.x + rect.width).toBeLessThanOrEqual(venue.widthMm - reach);
      for (const object of fixed) {
        const other = footprint(object);
        const grown = {
          x: other.x - reach,
          y: other.y - reach,
          width: other.width + reach * 2,
          height: other.height + reach * 2,
        };
        expect(rectsOverlap(rect, grown)).toBe(false);
      }
    }
  });

  it("is honest when the hall cannot seat everyone at tables", () => {
    const result = banquet(120);
    expect(result.report.seatsAfter).toBeLessThan(120);
    expect(result.report.shortfall).toBe(120 - result.report.seatsAfter);
    expect(result.summary).toMatch(/^Banquet seating/);
    expect(result.report.notes[0]).toMatch(/Shortfall/);
  });

  it("leaves at least a 0.9 m service lane between the chair rings of neighbouring tables", () => {
    const tables = banquet(200).objects.filter(
      (object) => object.kind === "round-table",
    );
    const reach = BANQUET_CHAIR_RING_MM;
    for (const [index, table] of tables.entries()) {
      for (const other of tables.slice(index + 1)) {
        const a = footprint(table);
        const b = footprint(other);
        const gapX =
          Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width)) - reach * 2;
        const gapY =
          Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height)) - reach * 2;
        expect(Math.max(gapX, gapY)).toBeGreaterThanOrEqual(900);
      }
    }
  });

  it("names tables in order", () => {
    const labels = banquet(16)
      .objects.filter((object) => object.kind === "round-table")
      .map((object) => object.label);
    expect(labels).toEqual(["Table 1", "Table 2"]);
  });
});

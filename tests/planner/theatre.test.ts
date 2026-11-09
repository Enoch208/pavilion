import type { PlacedObject } from "@shared/contracts/layout";
import { NOVA, novaObjects } from "@shared/demo/nova";
import { findIssues, footprint, rectsOverlap } from "@shared/geometry";
import { toShape } from "@shared/layout/shape";
import { describe, expect, it } from "vitest";

import { planLayout } from "../../server/lib/planner/plan";

const venue = NOVA.venue;

function seeded(): PlacedObject[] {
  return novaObjects().map((object, index) => ({
    ...object,
    id: `seed-${index}`,
  }));
}

function sequentialIds() {
  let next = 0;
  return () => `new-${(next += 1)}`;
}

function run(
  objects: PlacedObject[],
  attendeeTarget: number,
  minAisleMm = 1_200,
) {
  return planLayout({
    venue,
    objects,
    mode: "theatre",
    attendeeTarget,
    minAisleMm,
    budgetCents: NOVA.budgetCents,
    newId: sequentialIds(),
  });
}

const isSeating = (object: PlacedObject) =>
  object.kind === "chair" || object.kind === "round-table";

describe("theatre planner", () => {
  it("seats the guest target in a layout the engine accepts", () => {
    const result = run(seeded(), 140);
    expect(result.report.seatsAfter).toBe(140);
    expect(result.report.shortfall).toBe(0);
    expect(findIssues(result.objects.map(toShape), venue)).toEqual([]);
  });

  it("leaves every non-seating object exactly where it was", () => {
    const before = seeded().filter((object) => !isSeating(object));
    const after = run(seeded(), 140).objects.filter(
      (object) => !isSeating(object),
    );
    expect(after).toEqual(before);
  });

  it("keeps every chair the minimum aisle away from walls and fixed objects", () => {
    const aisle = 1_200;
    const result = run(seeded(), 140, aisle);
    const fixed = result.objects.filter(
      (object) => !isSeating(object) && object.kind !== "zone",
    );
    for (const chair of result.objects.filter(isSeating)) {
      const seat = footprint(chair);
      expect(seat.x).toBeGreaterThanOrEqual(aisle);
      expect(seat.y).toBeGreaterThanOrEqual(aisle);
      expect(seat.x + seat.width).toBeLessThanOrEqual(venue.widthMm - aisle);
      expect(seat.y + seat.height).toBeLessThanOrEqual(venue.heightMm - aisle);
      for (const object of fixed) {
        const rect = footprint(object);
        const grown = {
          x: rect.x - aisle,
          y: rect.y - aisle,
          width: rect.width + aisle * 2,
          height: rect.height + aisle * 2,
        };
        expect(rectsOverlap(seat, grown)).toBe(false);
      }
    }
  });

  it("never moves a locked chair and counts its seat", () => {
    const objects = seeded();
    const locked = objects.find((object) => object.label === "Chair F20")!;
    locked.locked = true;
    const result = run(objects, 120);
    expect(result.objects.find((object) => object.id === locked.id)).toEqual(
      locked,
    );
    expect(result.report.seatsAfter).toBe(120);
  });

  it("reuses existing chair ids and reports what changed", () => {
    const result = run(seeded(), 140);
    expect(result.report.added).toBe(20);
    expect(result.report.removed).toBe(0);
    const ids = new Set(result.objects.map((object) => object.id));
    for (const object of seeded()) expect(ids.has(object.id)).toBe(true);
  });

  it("reports a shortfall instead of breaking the rules when the hall is too small", () => {
    const result = run(seeded(), 1_000);
    expect(result.report.seatsAfter).toBeLessThan(1_000);
    expect(result.report.shortfall).toBe(1_000 - result.report.seatsAfter);
    expect(findIssues(result.objects.map(toShape), venue)).toEqual([]);
    expect(result.report.notes.join(" ")).toMatch(/shortfall|of 1000/i);
  });

  it("fits at most 156 theatre seats in the Nova hall with 1.2 m aisles", () => {
    const result = run(seeded(), 200);
    expect(result.report.seatsAfter).toBe(156);
    expect(result.report.shortfall).toBe(44);
  });

  it("seats as many guests as the rules allow before weighing anything else", () => {
    const short = run(seeded(), 1_000);
    const tighter = run(seeded(), 150);
    expect(short.report.seatsAfter).toBeGreaterThan(150);
    expect(tighter.report.seatsAfter).toBe(150);
  });

  it("prefers the existing layout when it already meets the target", () => {
    const result = run(seeded(), 120);
    expect(result.report.moved).toBe(0);
    expect(result.report.added).toBe(0);
  });

  it("is deterministic", () => {
    expect(run(seeded(), 140)).toEqual(run(seeded(), 140));
  });

  it("computes cost from catalog prices and flags an over-budget plan", () => {
    const result = planLayout({
      venue,
      objects: seeded(),
      mode: "theatre",
      attendeeTarget: 120,
      minAisleMm: 1_200,
      budgetCents: 100_000,
      newId: sequentialIds(),
    });
    expect(result.report.costAfterCents).toBe(304_000);
    expect(result.report.overBudget).toBe(true);
  });
});

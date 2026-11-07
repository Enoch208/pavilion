import { collisionFor } from "@shared/catalog";
import { findIssues, footprint } from "@shared/geometry";
import { summarizeLayout } from "@shared/layout/summary";
import { describe, expect, it } from "vitest";

import { NOVA, novaObjects } from "../../server/lib/demo/nova";

const objects = novaObjects();
const shapes = objects.map((object, index) => ({
  ...object,
  id: String(index),
  collision: collisionFor(object.kind),
}));

describe("Nova Product Launch seed", () => {
  it("is a valid layout: everything inside the hall, nothing overlapping", () => {
    expect(findIssues(shapes, NOVA.venue)).toEqual([]);
  });

  it("models exactly one seat per expected guest", () => {
    const summary = summarizeLayout({
      attendeeTarget: NOVA.attendeeTarget,
      budgetCents: NOVA.budgetCents,
      objects,
    });
    expect(summary.seats).toBe(120);
    expect(summary.unseated).toBe(0);
  });

  it("costs $3,040 of example prices against the $4,000 budget", () => {
    const summary = summarizeLayout({
      attendeeTarget: NOVA.attendeeTarget,
      budgetCents: NOVA.budgetCents,
      objects,
    });
    expect(summary.totalCostCents).toBe(304_000);
    expect(summary.overBudget).toBe(false);
  });

  it("keeps a centre aisle of at least 1.2 m in every row", () => {
    const rowA = objects.filter((object) => /^Chair A\d+$/.test(object.label));
    const seat10 = footprint(
      rowA.find((object) => object.label === "Chair A10")!,
    );
    const seat11 = footprint(
      rowA.find((object) => object.label === "Chair A11")!,
    );
    expect(seat11.x - (seat10.x + seat10.width)).toBeGreaterThanOrEqual(1_200);
  });

  it("locks the fixed geometry: both exits and the pillar", () => {
    const locked = objects
      .filter((object) => object.locked)
      .map((object) => object.kind);
    expect(locked.sort()).toEqual(["exit-zone", "exit-zone", "obstacle"]);
  });

  it("is deterministic", () => {
    expect(novaObjects()).toEqual(objects);
  });
});

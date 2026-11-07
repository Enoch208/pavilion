import {
  CATALOG,
  OBJECT_KINDS,
  catalogItem,
  collisionFor,
} from "@shared/catalog";
import { summarizeLayout } from "@shared/layout/summary";
import { describe, expect, it } from "vitest";

describe("catalog", () => {
  it("has unique ids and covers every object kind", () => {
    const ids = CATALOG.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(CATALOG.map((item) => item.kind))).toEqual(
      new Set(OBJECT_KINDS),
    );
  });

  it("uses whole millimetres on the 250 mm grid and whole cents", () => {
    for (const item of CATALOG) {
      expect(item.widthMm % 250).toBe(0);
      expect(item.heightMm % 250).toBe(0);
      expect(Number.isInteger(item.unitCostCents)).toBe(true);
      expect(Number.isInteger(item.capacity)).toBe(true);
    }
  });

  it("prices fixed geometry at zero and seats nobody on it", () => {
    for (const item of CATALOG.filter((entry) => entry.group === "fixed")) {
      expect(item.unitCostCents).toBe(0);
      expect(item.capacity).toBe(0);
    }
  });

  it("classifies exits as keep-clear and zones as overlays", () => {
    expect(collisionFor("exit-zone")).toBe("keepClear");
    expect(collisionFor("zone")).toBe("overlay");
    expect(collisionFor("chair")).toBe("solid");
  });

  it("finds items by id", () => {
    expect(catalogItem("chair-standard")?.kind).toBe("chair");
    expect(catalogItem("missing")).toBeUndefined();
  });
});

describe("summarizeLayout", () => {
  const chair = { capacity: 1, unitCostCents: 450 };
  const table = { capacity: 8, unitCostCents: 2_500 };

  it("counts modelled seats and the cost of every object", () => {
    expect(
      summarizeLayout({
        attendeeTarget: 10,
        budgetCents: 10_000,
        objects: [chair, chair, table],
      }),
    ).toEqual({
      seats: 10,
      attendeeTarget: 10,
      unseated: 0,
      totalCostCents: 3_400,
      budgetCents: 10_000,
      remainingCents: 6_600,
      overBudget: false,
    });
  });

  it("reports unseated guests and a negative remainder when over budget", () => {
    const summary = summarizeLayout({
      attendeeTarget: 5,
      budgetCents: 500,
      objects: [chair, chair],
    });
    expect(summary.unseated).toBe(3);
    expect(summary.remainingCents).toBe(-400);
    expect(summary.overBudget).toBe(true);
  });

  it("never reports negative unseated guests", () => {
    expect(
      summarizeLayout({ attendeeTarget: 0, budgetCents: 0, objects: [table] })
        .unseated,
    ).toBe(0);
  });
});

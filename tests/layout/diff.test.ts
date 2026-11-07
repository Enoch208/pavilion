import type { PlacedObject } from "@shared/contracts/layout";
import { diffLayouts } from "@shared/layout/diff";
import { describe, expect, it } from "vitest";

const chair = (id: string, xMm: number): PlacedObject => ({
  id,
  kind: "chair",
  label: id,
  xMm,
  yMm: 0,
  widthMm: 500,
  heightMm: 500,
  rotationDeg: 0,
  locked: false,
  capacity: 1,
  unitCostCents: 450,
  catalogItemId: "chair-standard",
});

describe("diffLayouts", () => {
  it("separates added, moved, removed and unchanged objects", () => {
    const diff = diffLayouts(
      [chair("kept", 0), chair("shifted", 500), chair("gone", 1_000)],
      [chair("kept", 0), chair("shifted", 750), chair("new", 2_000)],
    );
    expect([...diff.added]).toEqual(["new"]);
    expect([...diff.moved]).toEqual(["shifted"]);
    expect(diff.removed.map((object) => object.id)).toEqual(["gone"]);
  });

  it("treats a relabelled object in the same place as unchanged", () => {
    const diff = diffLayouts(
      [chair("a", 0)],
      [{ ...chair("a", 0), label: "Chair A1" }],
    );
    expect(diff.moved.size).toBe(0);
    expect(diff.added.size).toBe(0);
  });
});

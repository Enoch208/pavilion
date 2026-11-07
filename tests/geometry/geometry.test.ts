import {
  canOverlap,
  findFreeSpot,
  findIssues,
  footprint,
  insideVenue,
  rectsOverlap,
  snapToGrid,
  type Shape,
} from "@shared/geometry";
import { describe, expect, it } from "vitest";

const venue = { widthMm: 18_000, heightMm: 12_000 };

function shape(overrides: Partial<Shape> & { id: string }): Shape {
  return {
    xMm: 0,
    yMm: 0,
    widthMm: 1_000,
    heightMm: 500,
    rotationDeg: 0,
    collision: "solid",
    ...overrides,
  };
}

describe("footprint", () => {
  it("keeps width and height at 0 and 180 degrees", () => {
    for (const rotationDeg of [0, 180] as const) {
      expect(
        footprint(shape({ id: "a", xMm: 250, yMm: 500, rotationDeg })),
      ).toEqual({ x: 250, y: 500, width: 1_000, height: 500 });
    }
  });

  it("swaps width and height at 90 and 270 degrees", () => {
    for (const rotationDeg of [90, 270] as const) {
      expect(footprint(shape({ id: "a", rotationDeg }))).toEqual({
        x: 0,
        y: 0,
        width: 500,
        height: 1_000,
      });
    }
  });
});

describe("rectsOverlap", () => {
  const base = { x: 0, y: 0, width: 1_000, height: 1_000 };

  it("treats shared edges as touching, not overlapping", () => {
    expect(rectsOverlap(base, { ...base, x: 1_000 })).toBe(false);
    expect(rectsOverlap(base, { ...base, y: 1_000 })).toBe(false);
  });

  it("detects any shared area", () => {
    expect(rectsOverlap(base, { ...base, x: 999, y: 999 })).toBe(true);
    expect(
      rectsOverlap(base, { x: 250, y: 250, width: 250, height: 250 }),
    ).toBe(true);
  });
});

describe("insideVenue", () => {
  it("accepts a rect flush with every wall", () => {
    expect(
      insideVenue({ x: 0, y: 0, width: 18_000, height: 12_000 }, venue),
    ).toBe(true);
  });

  it("rejects a rect past any wall", () => {
    expect(insideVenue({ x: -1, y: 0, width: 100, height: 100 }, venue)).toBe(
      false,
    );
    expect(insideVenue({ x: 0, y: -1, width: 100, height: 100 }, venue)).toBe(
      false,
    );
    expect(
      insideVenue({ x: 17_901, y: 0, width: 100, height: 100 }, venue),
    ).toBe(false);
    expect(
      insideVenue({ x: 0, y: 11_901, width: 100, height: 100 }, venue),
    ).toBe(false);
  });
});

describe("canOverlap", () => {
  it("forbids solid objects from sharing floor or entering keep-clear zones", () => {
    expect(canOverlap("solid", "solid")).toBe(false);
    expect(canOverlap("solid", "keepClear")).toBe(false);
    expect(canOverlap("keepClear", "solid")).toBe(false);
  });

  it("lets overlays sit over anything and keep-clear zones overlap each other", () => {
    expect(canOverlap("overlay", "solid")).toBe(true);
    expect(canOverlap("keepClear", "overlay")).toBe(true);
    expect(canOverlap("keepClear", "keepClear")).toBe(true);
  });
});

describe("findIssues", () => {
  it("reports an object past the venue edge", () => {
    const shapes = [shape({ id: "a", xMm: 17_500 })];
    expect(findIssues(shapes, venue)).toEqual([
      { code: "OUT_OF_BOUNDS", objectIds: ["a"] },
    ]);
  });

  it("uses the rotated footprint for the boundary", () => {
    const shapes = [shape({ id: "a", yMm: 11_250, rotationDeg: 90 })];
    expect(findIssues(shapes, venue)).toEqual([
      { code: "OUT_OF_BOUNDS", objectIds: ["a"] },
    ]);
  });

  it("reports each forbidden overlap once, ids in input order", () => {
    const shapes = [
      shape({ id: "stage" }),
      shape({ id: "chair", xMm: 500 }),
      shape({ id: "carpet", collision: "overlay" }),
    ];
    expect(findIssues(shapes, venue)).toEqual([
      { code: "COLLISION", objectIds: ["stage", "chair"] },
    ]);
  });

  it("reports a solid object inside a keep-clear exit zone", () => {
    const shapes = [
      shape({ id: "exit", collision: "keepClear" }),
      shape({ id: "desk", xMm: 250 }),
    ];
    expect(findIssues(shapes, venue)).toEqual([
      { code: "COLLISION", objectIds: ["exit", "desk"] },
    ]);
  });

  it("limits the report to the focused objects when asked", () => {
    const shapes = [
      shape({ id: "a" }),
      shape({ id: "b", xMm: 500 }),
      shape({ id: "c", xMm: 17_500 }),
    ];
    expect(findIssues(shapes, venue, new Set(["c"]))).toEqual([
      { code: "OUT_OF_BOUNDS", objectIds: ["c"] },
    ]);
  });
});

describe("snapToGrid", () => {
  it("rounds to the nearest grid line", () => {
    expect(snapToGrid(124)).toBe(0);
    expect(snapToGrid(125)).toBe(250);
    expect(snapToGrid(5_380)).toBe(5_500);
    expect(snapToGrid(740, 500)).toBe(500);
  });
});

describe("findFreeSpot", () => {
  it("places a new object at the venue centre when it is free", () => {
    expect(
      findFreeSpot(
        { widthMm: 1_000, heightMm: 500, collision: "solid" },
        [],
        venue,
      ),
    ).toEqual({ xMm: 8_500, yMm: 5_750 });
  });

  it("moves to the nearest free grid position when the centre is taken", () => {
    const blocker = shape({ id: "a", xMm: 8_500, yMm: 5_750 });
    const spot = findFreeSpot(
      { widthMm: 1_000, heightMm: 500, collision: "solid" },
      [blocker],
      venue,
    );
    expect(spot).not.toBeNull();
    const placed = shape({ id: "new", ...spot! });
    expect(findIssues([blocker, placed], venue)).toEqual([]);
    expect(Math.abs(spot!.yMm - 5_750)).toBeLessThanOrEqual(500);
  });

  it("returns null when nothing fits", () => {
    const wall = shape({ id: "a", widthMm: 18_000, heightMm: 12_000 });
    expect(
      findFreeSpot(
        { widthMm: 1_000, heightMm: 500, collision: "solid" },
        [wall],
        venue,
      ),
    ).toBeNull();
  });
});

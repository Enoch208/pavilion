import { OBJECT_KINDS } from "@shared/catalog";
import type { PlacedObject } from "@shared/contracts/layout";
import { ROTATIONS } from "@shared/geometry";
import {
  APPROXIMATE_HEIGHTS_M,
  objectBlocks,
  venueBlocks,
  type SceneBlock,
} from "@shared/scene/blocks";
import { describe, expect, it } from "vitest";

function placed(overrides: Partial<PlacedObject>): PlacedObject {
  return {
    id: "obj",
    kind: "chair",
    label: "Chair",
    xMm: 2_000,
    yMm: 3_000,
    widthMm: 500,
    heightMm: 500,
    rotationDeg: 0,
    locked: false,
    capacity: 1,
    unitCostCents: 450,
    catalogItemId: null,
    ...overrides,
  };
}

function planBounds(block: SceneBlock) {
  const [cx, , cz] = block.centre;
  const [w, , d] = block.size;
  return {
    minX: cx - w / 2,
    maxX: cx + w / 2,
    minZ: cz - d / 2,
    maxZ: cz + d / 2,
  };
}

function chairPart(object: PlacedObject, part: "seat" | "back") {
  const block = objectBlocks(object).find((candidate) =>
    candidate.key.endsWith(`:${part}`),
  );
  if (!block) throw new Error(`chair has no ${part}`);
  return planBounds(block);
}

describe("scene blocks", () => {
  it("keeps every block of every kind inside its footprint, at any rotation", () => {
    for (const kind of OBJECT_KINDS) {
      for (const rotationDeg of ROTATIONS) {
        const object = placed({
          kind,
          rotationDeg,
          widthMm: 1_500,
          heightMm: 500,
        });
        const swap = rotationDeg === 90 || rotationDeg === 270;
        const w = (swap ? 500 : 1_500) / 1_000;
        const d = (swap ? 1_500 : 500) / 1_000;
        for (const block of objectBlocks(object)) {
          const bounds = planBounds(block);
          expect(bounds.minX).toBeGreaterThanOrEqual(2 - 1e-9);
          expect(bounds.maxX).toBeLessThanOrEqual(2 + w + 1e-9);
          expect(bounds.minZ).toBeGreaterThanOrEqual(3 - 1e-9);
          expect(bounds.maxZ).toBeLessThanOrEqual(3 + d + 1e-9);
          expect(block.size[1]).toBeGreaterThan(0);
        }
      }
    }
  });

  it("puts a chair's backrest behind the way it faces", () => {
    const edges = { 0: "maxZ", 90: "minX", 180: "minZ", 270: "maxX" } as const;
    for (const rotationDeg of ROTATIONS) {
      const chair = placed({ rotationDeg });
      const edge = edges[rotationDeg];
      expect(chairPart(chair, "back")[edge]).toBeCloseTo(
        chairPart(chair, "seat")[edge],
      );
    }
  });

  it("leaves a gap between chairs placed side by side", () => {
    const left = chairPart(placed({ xMm: 2_000 }), "seat");
    const right = chairPart(placed({ xMm: 2_500 }), "seat");
    expect(right.minX - left.maxX).toBeGreaterThan(0.05);
  });

  it("raises furniture to its typical height and keeps floor markings flat", () => {
    const top = (object: PlacedObject) =>
      Math.max(...objectBlocks(object).map((b) => b.centre[1] + b.size[1] / 2));
    expect(top(placed({ kind: "stage" }))).toBeCloseTo(
      APPROXIMATE_HEIGHTS_M.stage,
    );
    expect(top(placed({ kind: "chair" }))).toBeCloseTo(
      APPROXIMATE_HEIGHTS_M.chairBack,
    );
    expect(top(placed({ kind: "exit-zone" }))).toBeLessThan(0.02);
    expect(top(placed({ kind: "zone" }))).toBeLessThan(0.02);
  });

  it("draws round tables as cylinders", () => {
    const shapes = objectBlocks(
      placed({ kind: "round-table", widthMm: 1_750, heightMm: 1_750 }),
    );
    expect(shapes.every((block) => block.shape === "cylinder")).toBe(true);
  });

  it("frames the venue floor with four walls outside it", () => {
    const blocks = venueBlocks({ widthMm: 18_000, heightMm: 12_000 });
    const floor = blocks.find((block) => block.tone === "floor");
    expect(floor?.size[0]).toBe(18);
    expect(floor?.size[2]).toBe(12);
    const walls = blocks
      .filter((block) => block.tone === "wall")
      .map(planBounds);
    expect(walls).toHaveLength(4);
    for (const wall of walls) {
      const inside =
        wall.minX >= 0 && wall.maxX <= 18 && wall.minZ >= 0 && wall.maxZ <= 12;
      expect(inside).toBe(false);
    }
  });
});

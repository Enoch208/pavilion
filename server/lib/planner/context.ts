import type { PlacedObject } from "../../../shared/contracts/layout.js";
import {
  footprint,
  GRID_MM,
  type Rect,
} from "../../../shared/geometry/index.js";
import type { SeatingContext, SeatingParams } from "./types.js";

export const SEATING_KINDS: ReadonlySet<PlacedObject["kind"]> = new Set([
  "chair",
  "round-table",
]);

function grow(rect: Rect, byMm: number): Rect {
  return {
    x: rect.x - byMm,
    y: rect.y - byMm,
    width: rect.width + byMm * 2,
    height: rect.height + byMm * 2,
  };
}

function ceilToGrid(valueMm: number): number {
  return Math.ceil(valueMm / GRID_MM) * GRID_MM;
}

export function seatingContext(input: {
  venue: { widthMm: number; heightMm: number };
  kept: readonly PlacedObject[];
  minAisleMm: number;
  unitWidthMm: number;
  unitDepthMm: number;
  clearanceMm: number;
}): SeatingContext {
  const blocked = input.kept
    .filter((object) => object.kind !== "zone")
    .map((object) =>
      grow(
        footprint(object),
        SEATING_KINDS.has(object.kind) ? 0 : input.clearanceMm,
      ),
    );
  const stage = input.kept.find((object) => object.kind === "stage");
  const stageRect = stage ? footprint(stage) : null;
  return {
    venue: input.venue,
    minAisleMm: input.minAisleMm,
    centreXMm: stageRect
      ? Math.round(stageRect.x + stageRect.width / 2)
      : Math.round(input.venue.widthMm / 2),
    firstRowYMm: stageRect
      ? ceilToGrid(stageRect.y + stageRect.height + input.clearanceMm)
      : ceilToGrid(input.minAisleMm),
    unitWidthMm: input.unitWidthMm,
    unitDepthMm: input.unitDepthMm,
    blocked,
  };
}

export function theatreParams(minAisleMm: number): SeatingParams[] {
  const base = ceilToGrid(minAisleMm);
  const params: SeatingParams[] = [];
  for (const pitchMm of [1_000, 900]) {
    for (const aisleMm of [base, base + GRID_MM, base + GRID_MM * 2]) {
      for (const blocks of [2, 3] as const) {
        for (const unitsPerBlock of [10, 12, 14]) {
          params.push({ pitchMm, aisleMm, blocks, unitsPerBlock });
        }
      }
    }
  }
  return params;
}

import { findIssues } from "./issues.js";
import {
  GRID_MM,
  type CollisionClass,
  type Shape,
  type VenueSize,
} from "./shapes.js";

export type NewShape = {
  widthMm: number;
  heightMm: number;
  collision: CollisionClass;
};

export type Position = { xMm: number; yMm: number };

function gridPositions(
  size: NewShape,
  venue: VenueSize,
  gridMm: number,
): Position[] {
  const positions: Position[] = [];
  for (let y = 0; y + size.heightMm <= venue.heightMm; y += gridMm) {
    for (let x = 0; x + size.widthMm <= venue.widthMm; x += gridMm) {
      positions.push({ xMm: x, yMm: y });
    }
  }
  return positions;
}

function distanceFromCentre(
  position: Position,
  size: NewShape,
  venue: VenueSize,
): number {
  const dx = position.xMm + size.widthMm / 2 - venue.widthMm / 2;
  const dy = position.yMm + size.heightMm / 2 - venue.heightMm / 2;
  return dx * dx + dy * dy;
}

export function findFreeSpot(
  size: NewShape,
  shapes: readonly Shape[],
  venue: VenueSize,
  gridMm = GRID_MM,
): Position | null {
  const probeId = "__probe__";
  const focus = new Set([probeId]);
  const ranked = gridPositions(size, venue, gridMm)
    .map((position) => ({
      position,
      distance: distanceFromCentre(position, size, venue),
    }))
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        a.position.yMm - b.position.yMm ||
        a.position.xMm - b.position.xMm,
    );
  for (const { position } of ranked) {
    const probe: Shape = { id: probeId, rotationDeg: 0, ...size, ...position };
    if (findIssues([...shapes, probe], venue, focus).length === 0) {
      return position;
    }
  }
  return null;
}

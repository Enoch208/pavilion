import {
  footprint,
  rectsOverlap,
  type Rect,
} from "../../../shared/geometry/index.js";
import type { Seat, SeatingContext, SeatingParams } from "./types.js";

function blockStarts(context: SeatingContext, params: SeatingParams): number[] {
  const width = params.unitsPerBlock * context.unitWidthMm;
  const centre = context.centreXMm;
  if (params.blocks === 2) {
    return [
      Math.round(centre - params.aisleMm / 2 - width),
      Math.round(centre + params.aisleMm / 2),
    ];
  }
  const middle = Math.round(centre - width / 2);
  return [
    middle - params.aisleMm - width,
    middle,
    middle + width + params.aisleMm,
  ];
}

function seatRect(context: SeatingContext, xMm: number, yMm: number): Rect {
  return footprint({
    xMm,
    yMm,
    widthMm: context.unitWidthMm,
    heightMm: context.unitDepthMm,
    rotationDeg: 0,
  });
}

function fits(context: SeatingContext, rect: Rect): boolean {
  const margin = context.minAisleMm;
  const { widthMm, heightMm } = context.venue;
  if (rect.x < margin || rect.y < margin) return false;
  if (rect.x + rect.width > widthMm - margin) return false;
  if (rect.y + rect.height > heightMm - margin) return false;
  return !context.blocked.some((blocked) => rectsOverlap(rect, blocked));
}

export function candidateRows(
  context: SeatingContext,
  params: SeatingParams,
): Seat[][] {
  const starts = blockStarts(context, params);
  const rows: Seat[][] = [];
  const lastY =
    context.venue.heightMm - context.minAisleMm - context.unitDepthMm;
  for (
    let y = context.firstRowYMm, row = 0;
    y <= lastY;
    y += params.pitchMm, row += 1
  ) {
    const seats: Seat[] = [];
    for (const start of starts) {
      for (let unit = 0; unit < params.unitsPerBlock; unit += 1) {
        const x = start + unit * context.unitWidthMm;
        if (fits(context, seatRect(context, x, y)))
          seats.push({ xMm: x, yMm: y, row });
      }
    }
    if (seats.length > 0) rows.push(seats);
  }
  return rows;
}

function closestToCentre(
  seats: Seat[],
  count: number,
  centreXMm: number,
  unitWidthMm: number,
) {
  const distance = (seat: Seat) =>
    Math.abs(seat.xMm + unitWidthMm / 2 - centreXMm);
  return [...seats]
    .sort((a, b) => distance(a) - distance(b) || a.xMm - b.xMm)
    .slice(0, count);
}

export function fillRows(
  rows: readonly Seat[][],
  needed: number,
  context: SeatingContext,
  capacityPerUnit: number,
): Seat[] {
  const chosen: Seat[] = [];
  let remaining = Math.ceil(needed / capacityPerUnit);
  for (const row of rows) {
    if (remaining <= 0) break;
    const take =
      row.length <= remaining
        ? row
        : closestToCentre(
            row,
            remaining,
            context.centreXMm,
            context.unitWidthMm,
          );
    chosen.push(...take);
    remaining -= take.length;
  }
  return chosen.sort((a, b) => a.yMm - b.yMm || a.xMm - b.xMm);
}

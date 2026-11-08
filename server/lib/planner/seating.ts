import { rectsOverlap, type Rect } from "../../../shared/geometry/index.js";
import type { Seat, SeatingContext, SeatingParams } from "./types.js";

function blockStarts(context: SeatingContext, params: SeatingParams): number[] {
  const width = params.unitsPerBlock * params.slotMm;
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

function serviceArea(
  context: SeatingContext,
  slotX: number,
  slotMm: number,
  y: number,
): Rect {
  const { unit } = context;
  const width = unit.widthMm + unit.ringMm * 2;
  return {
    x: Math.round(slotX + (slotMm - width) / 2),
    y,
    width,
    height: unit.depthMm + unit.ringMm * 2,
  };
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
  const { unit } = context;
  const starts = blockStarts(context, params);
  const serviceDepth = unit.depthMm + unit.ringMm * 2;
  const lastY = context.venue.heightMm - context.minAisleMm - serviceDepth;
  const rows: Seat[][] = [];
  for (
    let y = context.firstRowYMm, row = 0;
    y <= lastY;
    y += params.pitchMm, row += 1
  ) {
    const seats: Seat[] = [];
    for (const start of starts) {
      for (let slot = 0; slot < params.unitsPerBlock; slot += 1) {
        const area = serviceArea(
          context,
          start + slot * params.slotMm,
          params.slotMm,
          y,
        );
        if (fits(context, area)) {
          seats.push({
            xMm: area.x + unit.ringMm,
            yMm: area.y + unit.ringMm,
            row,
          });
        }
      }
    }
    if (seats.length > 0) rows.push(seats);
  }
  return rows;
}

function closestToCentre(
  seats: Seat[],
  count: number,
  context: SeatingContext,
) {
  const distance = (seat: Seat) =>
    Math.abs(seat.xMm + context.unit.widthMm / 2 - context.centreXMm);
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
      row.length <= remaining ? row : closestToCentre(row, remaining, context);
    chosen.push(...take);
    remaining -= take.length;
  }
  return chosen.sort((a, b) => a.yMm - b.yMm || a.xMm - b.xMm);
}

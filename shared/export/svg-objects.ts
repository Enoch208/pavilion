import type { ObjectKind } from "../catalog.js";
import type { PlacedObject } from "../contracts/layout.js";
import { footprint, type Rect } from "../geometry/index.js";
import { escapeMarkup } from "./format.js";
import type { SeatRow } from "./pack.js";

type Paint = { fill: string; stroke: string };

const PAINT: Record<ObjectKind, Paint> = {
  stage: { fill: "#d6d3d1", stroke: "#44403c" },
  chair: { fill: "#ffffff", stroke: "#57534e" },
  "round-table": { fill: "#ffffff", stroke: "#57534e" },
  "registration-desk": { fill: "#e7e5e4", stroke: "#57534e" },
  "refreshment-station": { fill: "#e7e5e4", stroke: "#57534e" },
  "display-screen": { fill: "#292524", stroke: "#0c0a09" },
  zone: { fill: "#eef2ff", stroke: "#6366f1" },
  "exit-zone": { fill: "#dcfce7", stroke: "#15803d" },
  obstacle: { fill: "#44403c", stroke: "#0c0a09" },
};

const LABELLED: ReadonlySet<ObjectKind> = new Set([
  "stage",
  "round-table",
  "registration-desk",
  "refreshment-station",
  "zone",
  "exit-zone",
]);

const LAYER: Partial<Record<ObjectKind, number>> = { zone: 0, "exit-zone": 1 };

export const LOCKED_DASH = "140 90";

function outline(object: PlacedObject, rect: Rect): string {
  const paint = PAINT[object.kind];
  const dash = object.locked ? ` stroke-dasharray="${LOCKED_DASH}"` : "";
  const style = `fill="${paint.fill}" stroke="${paint.stroke}" stroke-width="30"${dash}`;
  if (object.kind === "round-table") {
    return `<ellipse cx="${rect.x + rect.width / 2}" cy="${rect.y + rect.height / 2}" rx="${rect.width / 2}" ry="${rect.height / 2}" ${style}/>`;
  }
  const corner = object.kind === "chair" ? 80 : 40;
  return `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${corner}" ${style}/>`;
}

function label(object: PlacedObject, rect: Rect): string {
  if (!LABELLED.has(object.kind) || rect.width < 1_000) return "";
  const size = Math.round(
    Math.min(
      320,
      rect.height * 0.35,
      (rect.width * 0.9) / (Math.max(object.label.length, 1) * 0.6),
    ),
  );
  return `<text x="${rect.x + rect.width / 2}" y="${rect.y + rect.height / 2}" text-anchor="middle" dominant-baseline="central" font-size="${size}" fill="#1c1917">${escapeMarkup(object.label)}</text>`;
}

export function objectMarkup(objects: readonly PlacedObject[]): string {
  return [...objects]
    .sort((a, b) => (LAYER[a.kind] ?? 2) - (LAYER[b.kind] ?? 2))
    .map((object) => {
      const rect = footprint(object);
      return `<g data-object-id="${escapeMarkup(object.id)}"><title>${escapeMarkup(object.label)}</title>${outline(object, rect)}${label(object, rect)}</g>`;
    })
    .join("");
}

export function rowMarkup(rows: readonly SeatRow[]): string {
  return rows
    .map(
      (row) =>
        `<text x="-220" y="${row.yMm + row.depthMm / 2}" text-anchor="end" dominant-baseline="central" font-size="220" fill="#57534e">${row.number}</text>`,
    )
    .join("");
}

import type { VenueSize } from "../geometry/index.js";
import { escapeMarkup, metres, plural, utcStamp } from "./format.js";
import type { SetupPack } from "./pack.js";
import { objectMarkup, rowMarkup } from "./svg-objects.js";

const MARGIN_MM = 1_200;
const TITLE_MM = 1_500;
const GRID_STEP_MM = 1_000;
const SCALE_STEPS_MM = [1_000, 2_000, 5_000, 10_000, 20_000, 50_000];
const FONT = "Inter, Helvetica, Arial, sans-serif";
const INK = "#1c1917";

export type FloorPlanSvg = { svg: string; widthPx: number; heightPx: number };

function gridLines(venue: VenueSize): string {
  const lines: string[] = [];
  for (let x = GRID_STEP_MM; x < venue.widthMm; x += GRID_STEP_MM) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${venue.heightMm}"/>`);
  }
  for (let y = GRID_STEP_MM; y < venue.heightMm; y += GRID_STEP_MM) {
    lines.push(`<line x1="0" y1="${y}" x2="${venue.widthMm}" y2="${y}"/>`);
  }
  return `<g stroke="#e7e5e4" stroke-width="12">${lines.join("")}</g>`;
}

function dimensions(venue: VenueSize): string {
  const { widthMm: w, heightMm: h } = venue;
  const across = `<path d="M0 -600H${w}M0 -750V-450M${w} -750V-450" stroke="${INK}" stroke-width="20" fill="none"/><text x="${w / 2}" y="-760" text-anchor="middle" font-size="280" fill="${INK}">${metres(w)} m</text>`;
  const down = `<path d="M-700 0V${h}M-850 0H-550M-850 ${h}H-550" stroke="${INK}" stroke-width="20" fill="none"/><text transform="translate(-860 ${h / 2}) rotate(-90)" text-anchor="middle" font-size="280" fill="${INK}">${metres(h)} m</text>`;
  return across + down;
}

function northArrow(venue: VenueSize): string {
  const x = venue.widthMm + 600;
  return `<path d="M${x} -1050L${x + 150} -600H${x - 150}Z" fill="${INK}"/><text x="${x}" y="-300" text-anchor="middle" font-size="240" font-weight="600" fill="${INK}">N</text>`;
}

function scaleBar(venue: VenueSize): string {
  const limit = Math.max(GRID_STEP_MM, venue.widthMm / 3);
  const length =
    [...SCALE_STEPS_MM].reverse().find((step) => step <= limit) ?? GRID_STEP_MM;
  const step = length / 5;
  const y = venue.heightMm + 400;
  const blocks = Array.from(
    { length: 5 },
    (_, index) =>
      `<rect x="${index * step}" y="${y}" width="${step}" height="120" fill="${index % 2 === 0 ? INK : "#ffffff"}" stroke="${INK}" stroke-width="15"/>`,
  ).join("");
  const labels = `<text x="0" y="${y + 420}" font-size="220" fill="${INK}">0</text><text x="${length}" y="${y + 420}" text-anchor="middle" font-size="220" fill="${INK}">${metres(length)} m</text>`;
  return blocks + labels;
}

function fitFont(text: string, widthMm: number, maxMm: number): number {
  return Math.round(
    Math.min(maxMm, widthMm / (Math.max(text.length, 1) * 0.55)),
  );
}

function titleBlock(pack: SetupPack, widthMm: number): string {
  const { event, venue, plan, exportedAt } = pack.source;
  const y = venue.heightMm + MARGIN_MM;
  const detail = [
    `${venue.name}, ${metres(venue.widthMm)} × ${metres(venue.heightMm)} m`,
    `Version ${plan.version}`,
    `${plural(pack.summary.seats, "seat", "seats")} for ${pack.summary.attendeeTarget} guests`,
    "Dashed outline: locked in place",
    `Exported ${utcStamp(exportedAt)}`,
  ].join(" · ");
  const usable = widthMm - MARGIN_MM;
  return `<text x="0" y="${y + 450}" font-size="${fitFont(event.title, usable, 420)}" font-weight="600" fill="${INK}">${escapeMarkup(event.title)}</text><text x="0" y="${y + 1000}" font-size="${fitFont(detail, usable, 240)}" fill="#57534e">${escapeMarkup(detail)}</text>`;
}

export function renderFloorPlanSvg(
  pack: SetupPack,
  widthPx = 1_600,
): FloorPlanSvg {
  const { venue, event } = pack.source;
  const width = venue.widthMm + MARGIN_MM * 2;
  const height = venue.heightMm + MARGIN_MM * 2 + TITLE_MM;
  const heightPx = Math.round((widthPx * height) / width);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-MARGIN_MM} ${-MARGIN_MM} ${width} ${height}" width="${widthPx}" height="${heightPx}" font-family="${FONT}" role="img" aria-label="${escapeMarkup(`Floor plan of ${event.title}`)}">`,
    `<rect x="${-MARGIN_MM}" y="${-MARGIN_MM}" width="${width}" height="${height}" fill="#ffffff"/>`,
    `<rect x="0" y="0" width="${venue.widthMm}" height="${venue.heightMm}" fill="#fafaf9"/>`,
    gridLines(venue),
    objectMarkup(pack.source.objects),
    `<rect x="0" y="0" width="${venue.widthMm}" height="${venue.heightMm}" fill="none" stroke="${INK}" stroke-width="80"/>`,
    rowMarkup(pack.rows),
    dimensions(venue),
    northArrow(venue),
    scaleBar(venue),
    titleBlock(pack, width),
    "</svg>",
  ].join("");
  return { svg, widthPx, heightPx };
}

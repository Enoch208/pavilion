import { escapeMarkup, metres, money, plural, utcStamp } from "./format.js";
import { itemTable, placementTable, rowTable } from "./html-tables.js";
import type { SetupPack } from "./pack.js";

const STYLE = `
@page { size: A4; margin: 14mm; }
* { box-sizing: border-box; }
body { margin: 0; padding: 24px; font: 13px/1.45 Inter, Helvetica, Arial, sans-serif; color: #1c1917; background: #fff; }
main { max-width: 960px; margin: 0 auto; }
h1 { font-size: 22px; margin: 0 0 4px; }
h2 { font-size: 15px; margin: 28px 0 8px; }
p { margin: 0; }
.meta { color: #57534e; }
.facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 20px 0; padding: 0; }
.facts div { border: 1px solid #e7e5e4; border-radius: 6px; padding: 8px 10px; }
.facts dt { color: #57534e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
.facts dd { margin: 2px 0 0; font-size: 15px; font-weight: 600; }
.warn { color: #b91c1c; }
figure { margin: 0; border: 1px solid #e7e5e4; border-radius: 6px; overflow: hidden; break-inside: avoid; }
figure svg { display: block; width: 100%; height: auto; }
table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #e7e5e4; vertical-align: top; }
th { font-size: 11px; color: #57534e; font-weight: 600; }
.num { text-align: right; white-space: nowrap; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
tfoot td { font-weight: 600; border-top: 1px solid #a8a29e; border-bottom: 0; }
.notes { margin-top: 28px; padding-left: 18px; color: #57534e; font-size: 12px; }
@media print { body { padding: 0; } h2 { break-after: avoid; } }
`;

function fact(term: string, value: string, warn: boolean): string {
  return `<div><dt>${escapeMarkup(term)}</dt><dd${warn ? ' class="warn"' : ""}>${escapeMarkup(value)}</dd></div>`;
}

function facts(pack: SetupPack): string {
  const { summary } = pack;
  const { currency } = pack.source.event;
  const { plan } = pack.source;
  const cost = summary.overBudget
    ? `${money(summary.totalCostCents, currency)} (${money(-summary.remainingCents, currency)} over)`
    : `${money(summary.totalCostCents, currency)} of ${money(summary.budgetCents, currency)}`;
  return `<dl class="facts">${[
    fact(
      "Seats",
      `${summary.seats} for ${summary.attendeeTarget} guests`,
      summary.unseated > 0,
    ),
    fact("Cost (example prices)", cost, summary.overBudget),
    fact(
      "Layout",
      `${plan.mode[0]!.toUpperCase()}${plan.mode.slice(1)}, ${metres(plan.minAisleMm)} m aisles`,
      false,
    ),
    fact(
      "Layout check",
      pack.issues ? "Needs attention" : "Walls and overlaps clear",
      pack.issues !== null,
    ),
  ].join("")}</dl>`;
}

function header(pack: SetupPack): string {
  const { event, venue, plan, exportedAt } = pack.source;
  const about = [
    event.eventType,
    event.eventDate,
    `${venue.name}, ${metres(venue.widthMm)} × ${metres(venue.heightMm)} m`,
  ].filter((part): part is string => Boolean(part));
  return `<header><h1>${escapeMarkup(event.title)} setup pack</h1><p>${escapeMarkup(about.join(" · "))}</p><p class="meta">Floor plan version ${plan.version}, exported ${escapeMarkup(utcStamp(exportedAt))}</p></header>`;
}

function section(title: string, body: string): string {
  return `<section><h2>${escapeMarkup(title)}</h2>${body}</section>`;
}

const NOTES = [
  "Positions are in metres from the venue's north-west corner to each item's north-west corner. Sizes are as placed, after any turn.",
  "Seats are modelled seating, not a legal occupancy figure.",
  "Prices are example data from Pavilion's catalog, not quotes.",
  "The layout check covers walls and overlaps only. It is not a fire-safety or evacuation review.",
];

export function renderSetupPackHtml(pack: SetupPack, svg: string): string {
  const { event, plan } = pack.source;
  const title = `${event.title} setup pack, version ${plan.version}`;
  const issues = pack.issues
    ? `<p class="warn">${escapeMarkup(pack.issues)}</p>`
    : "";
  const seating =
    pack.rows.length > 0
      ? section(
          `Seating rows (${plural(pack.rows.length, "row", "rows")})`,
          rowTable(pack),
        )
      : "";
  const equipment =
    pack.equipment.length > 0
      ? section("Equipment placement", placementTable(pack.equipment))
      : "";
  const features =
    pack.features.length > 0
      ? section("Fixed venue features", placementTable(pack.features))
      : "";
  return [
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeMarkup(title)}</title><style>${STYLE}</style></head><body><main>`,
    header(pack),
    facts(pack),
    issues,
    `<figure>${svg}</figure>`,
    section("Item list", itemTable(pack)),
    seating,
    equipment,
    features,
    `<ul class="notes">${NOTES.map((note) => `<li>${escapeMarkup(note)}</li>`).join("")}</ul>`,
    "</main></body></html>",
  ].join("");
}

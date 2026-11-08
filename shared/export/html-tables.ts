import { escapeMarkup, metresFixed, money } from "./format.js";
import type { Placement, SetupPack } from "./pack.js";

type Cell = string | { text: string; numeric: true };

function cell(value: Cell, tag: "td" | "th"): string {
  if (typeof value === "string") {
    return `<${tag}>${escapeMarkup(value)}</${tag}>`;
  }
  return `<${tag} class="num">${escapeMarkup(value.text)}</${tag}>`;
}

function num(text: string | number): Cell {
  return { text: String(text), numeric: true };
}

function table(
  headers: readonly Cell[],
  rows: readonly (readonly Cell[])[],
  foot: readonly Cell[] | null = null,
): string {
  const head = `<thead><tr>${headers.map((value) => cell(value, "th")).join("")}</tr></thead>`;
  const body = `<tbody>${rows.map((row) => `<tr>${row.map((value) => cell(value, "td")).join("")}</tr>`).join("")}</tbody>`;
  const tail = foot
    ? `<tfoot><tr>${foot.map((value) => cell(value, "td")).join("")}</tr></tfoot>`
    : "";
  return `<table>${head}${body}${tail}</table>`;
}

function size(widthMm: number, depthMm: number): string {
  return `${metresFixed(widthMm)} × ${metresFixed(depthMm)}`;
}

export function itemTable(pack: SetupPack): string {
  const { currency } = pack.source.event;
  const rows = pack.items.map((item) => [
    item.name,
    num(size(item.widthMm, item.depthMm)),
    num(item.quantity),
    num(item.capacity * item.quantity),
    num(money(item.unitCostCents, currency)),
    num(money(item.lineCostCents, currency)),
  ]);
  const quantity = pack.items.reduce((sum, item) => sum + item.quantity, 0);
  return table(
    [
      "Item",
      num("Size (m)"),
      num("Qty"),
      num("Seats"),
      num("Unit price"),
      num("Total"),
    ],
    rows,
    [
      "Total",
      "",
      num(quantity),
      num(pack.summary.seats),
      "",
      num(money(pack.summary.totalCostCents, currency)),
    ],
  );
}

export function rowTable(pack: SetupPack): string {
  return table(
    [
      num("Row"),
      num("Chairs"),
      "Labels",
      num("From north wall"),
      num("From west wall"),
    ],
    pack.rows.map((row) => [
      num(row.number),
      num(row.chairs),
      row.firstLabel === row.lastLabel
        ? row.firstLabel
        : `${row.firstLabel} to ${row.lastLabel}`,
      num(`${metresFixed(row.yMm)} m`),
      num(`${metresFixed(row.fromXMm)} to ${metresFixed(row.toXMm)} m`),
    ]),
  );
}

export function placementTable(placements: readonly Placement[]): string {
  return table(
    [
      "Label",
      "Item",
      num("x (m)"),
      num("y (m)"),
      num("Size (m)"),
      num("Turn"),
      "Locked",
    ],
    placements.map((entry) => [
      entry.label,
      entry.name,
      num(metresFixed(entry.xMm)),
      num(metresFixed(entry.yMm)),
      num(size(entry.widthMm, entry.depthMm)),
      num(`${entry.rotationDeg}°`),
      entry.locked ? "Yes" : "No",
    ]),
  );
}

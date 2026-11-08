import { CATALOG, type ObjectKind } from "../catalog.js";
import type { PackSource } from "../contracts/export.js";
import type { PlacedObject } from "../contracts/layout.js";
import { findIssues, footprint } from "../geometry/index.js";
import { describeIssues } from "../layout/describe.js";
import { toShape } from "../layout/shape.js";
import { summarizeLayout, type LayoutSummary } from "../layout/summary.js";

export type PackItem = {
  name: string;
  kind: ObjectKind;
  quantity: number;
  widthMm: number;
  depthMm: number;
  capacity: number;
  unitCostCents: number;
  lineCostCents: number;
};

export type SeatRow = {
  number: number;
  yMm: number;
  depthMm: number;
  chairs: number;
  fromXMm: number;
  toXMm: number;
  firstLabel: string;
  lastLabel: string;
};

export type Placement = {
  id: string;
  label: string;
  name: string;
  kind: ObjectKind;
  xMm: number;
  yMm: number;
  widthMm: number;
  depthMm: number;
  rotationDeg: number;
  locked: boolean;
};

export type SetupPack = {
  source: PackSource;
  summary: LayoutSummary;
  items: PackItem[];
  rows: SeatRow[];
  equipment: Placement[];
  features: Placement[];
  issues: string | null;
};

const FIXED_KINDS: ReadonlySet<ObjectKind> = new Set(
  CATALOG.filter((item) => item.group === "fixed").map((item) => item.kind),
);

const KIND_ORDER = new Map(CATALOG.map((item, index) => [item.kind, index]));

export function isFixedKind(kind: ObjectKind): boolean {
  return FIXED_KINDS.has(kind);
}

function itemName(object: PlacedObject): string {
  const item =
    CATALOG.find((entry) => entry.id === object.catalogItemId) ??
    CATALOG.find((entry) => entry.kind === object.kind);
  return item?.name ?? object.kind;
}

function byKind(a: { kind: ObjectKind }, b: { kind: ObjectKind }): number {
  return (KIND_ORDER.get(a.kind) ?? 0) - (KIND_ORDER.get(b.kind) ?? 0);
}

function itemList(objects: readonly PlacedObject[]): PackItem[] {
  const lines = new Map<string, PackItem>();
  for (const object of objects) {
    if (isFixedKind(object.kind)) continue;
    const name = itemName(object);
    const key = [
      name,
      object.widthMm,
      object.heightMm,
      object.capacity,
      object.unitCostCents,
    ].join("|");
    const line = lines.get(key) ?? {
      name,
      kind: object.kind,
      quantity: 0,
      widthMm: object.widthMm,
      depthMm: object.heightMm,
      capacity: object.capacity,
      unitCostCents: object.unitCostCents,
      lineCostCents: 0,
    };
    line.quantity += 1;
    line.lineCostCents += object.unitCostCents;
    lines.set(key, line);
  }
  return [...lines.values()].sort(
    (a, b) =>
      byKind(a, b) ||
      a.name.localeCompare(b.name) ||
      b.quantity - a.quantity ||
      a.unitCostCents - b.unitCostCents,
  );
}

function seatRows(objects: readonly PlacedObject[]): SeatRow[] {
  const byY = new Map<number, PlacedObject[]>();
  for (const object of objects) {
    if (object.kind !== "chair") continue;
    const y = footprint(object).y;
    byY.set(y, [...(byY.get(y) ?? []), object]);
  }
  return [...byY.entries()]
    .sort(([a], [b]) => a - b)
    .map(([yMm, chairs], index) => {
      const sorted = [...chairs].sort((a, b) => a.xMm - b.xMm);
      const rects = sorted.map(footprint);
      return {
        number: index + 1,
        yMm,
        depthMm: Math.max(...rects.map((rect) => rect.height)),
        chairs: sorted.length,
        fromXMm: Math.min(...rects.map((rect) => rect.x)),
        toXMm: Math.max(...rects.map((rect) => rect.x + rect.width)),
        firstLabel: sorted[0]!.label,
        lastLabel: sorted[sorted.length - 1]!.label,
      };
    });
}

function placement(object: PlacedObject): Placement {
  const rect = footprint(object);
  return {
    id: object.id,
    label: object.label,
    name: itemName(object),
    kind: object.kind,
    xMm: rect.x,
    yMm: rect.y,
    widthMm: rect.width,
    depthMm: rect.height,
    rotationDeg: object.rotationDeg,
    locked: object.locked,
  };
}

function placements(objects: readonly PlacedObject[]): Placement[] {
  return objects
    .map(placement)
    .sort((a, b) => a.yMm - b.yMm || a.xMm - b.xMm || byKind(a, b));
}

export function buildSetupPack(source: PackSource): SetupPack {
  const { objects, venue, event } = source;
  const labels = new Map(objects.map((object) => [object.id, object.label]));
  const found = findIssues(objects.map(toShape), venue);
  return {
    source,
    summary: summarizeLayout({
      attendeeTarget: event.attendeeTarget,
      budgetCents: event.budgetCents,
      objects,
    }),
    items: itemList(objects),
    rows: seatRows(objects),
    equipment: placements(
      objects.filter(
        (object) => object.kind !== "chair" && !isFixedKind(object.kind),
      ),
    ),
    features: placements(objects.filter((object) => isFixedKind(object.kind))),
    issues:
      found.length > 0
        ? describeIssues(found, (id) => labels.get(id) ?? id)
        : null,
  };
}

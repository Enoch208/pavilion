import type { CollisionClass } from "./geometry/index.js";

export const OBJECT_KINDS = [
  "stage",
  "chair",
  "round-table",
  "registration-desk",
  "refreshment-station",
  "display-screen",
  "zone",
  "exit-zone",
  "obstacle",
] as const;
export type ObjectKind = (typeof OBJECT_KINDS)[number];

const COLLISION_BY_KIND: Record<ObjectKind, CollisionClass> = {
  stage: "solid",
  chair: "solid",
  "round-table": "solid",
  "registration-desk": "solid",
  "refreshment-station": "solid",
  "display-screen": "solid",
  zone: "overlay",
  "exit-zone": "keepClear",
  obstacle: "solid",
};

export function collisionFor(kind: ObjectKind): CollisionClass {
  return COLLISION_BY_KIND[kind];
}

export type CatalogItem = {
  id: string;
  kind: ObjectKind;
  name: string;
  group: "equipment" | "fixed";
  widthMm: number;
  heightMm: number;
  capacity: number;
  unitCostCents: number;
};

export const CATALOG: readonly CatalogItem[] = [
  {
    id: "stage-5x3",
    kind: "stage",
    name: "Presentation stage",
    group: "equipment",
    widthMm: 5_000,
    heightMm: 3_000,
    capacity: 0,
    unitCostCents: 120_000,
  },
  {
    id: "chair-standard",
    kind: "chair",
    name: "Chair",
    group: "equipment",
    widthMm: 500,
    heightMm: 500,
    capacity: 1,
    unitCostCents: 450,
  },
  {
    id: "table-round-8",
    kind: "round-table",
    name: "Round table, seats 8",
    group: "equipment",
    widthMm: 1_750,
    heightMm: 1_750,
    capacity: 8,
    unitCostCents: 2_500,
  },
  {
    id: "desk-registration",
    kind: "registration-desk",
    name: "Registration desk",
    group: "equipment",
    widthMm: 2_000,
    heightMm: 750,
    capacity: 0,
    unitCostCents: 15_000,
  },
  {
    id: "station-refreshment",
    kind: "refreshment-station",
    name: "Refreshment station",
    group: "equipment",
    widthMm: 2_500,
    heightMm: 750,
    capacity: 0,
    unitCostCents: 35_000,
  },
  {
    id: "screen-display",
    kind: "display-screen",
    name: "Display screen",
    group: "equipment",
    widthMm: 1_500,
    heightMm: 500,
    capacity: 0,
    unitCostCents: 40_000,
  },
  {
    id: "zone-area",
    kind: "zone",
    name: "Area marker",
    group: "fixed",
    widthMm: 3_000,
    heightMm: 3_000,
    capacity: 0,
    unitCostCents: 0,
  },
  {
    id: "exit-zone",
    kind: "exit-zone",
    name: "Exit, keep clear",
    group: "fixed",
    widthMm: 1_000,
    heightMm: 1_500,
    capacity: 0,
    unitCostCents: 0,
  },
  {
    id: "obstacle-pillar",
    kind: "obstacle",
    name: "Structural pillar",
    group: "fixed",
    widthMm: 750,
    heightMm: 750,
    capacity: 0,
    unitCostCents: 0,
  },
];

export function catalogItem(id: string): CatalogItem | undefined {
  return CATALOG.find((item) => item.id === id);
}

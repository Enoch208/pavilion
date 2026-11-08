import { catalogItem } from "../catalog.js";
import type { PlacedObject } from "../contracts/layout.js";

export type ObjectDraft = Omit<PlacedObject, "id">;

export const NOVA = {
  demoKey: "nova-launch",
  title: "Nova Product Launch",
  eventType: "Product launch",
  attendeeTarget: 120,
  currency: "USD",
  budgetCents: 400_000,
  venue: { name: "Main hall", widthMm: 18_000, heightMm: 12_000 },
  mode: "theatre",
  minAisleMm: 1_200,
} as const;

const ROWS = ["A", "B", "C", "D", "E", "F"] as const;
const SEATS_PER_BLOCK = 10;
const BLOCK_LEFT_X = [3_250, 9_750] as const;
const FIRST_ROW_Y = 4_500;
const ROW_PITCH_MM = 1_000;

function draft(
  catalogItemId: string,
  label: string,
  xMm: number,
  yMm: number,
  locked = false,
): ObjectDraft {
  const item = catalogItem(catalogItemId);
  if (!item)
    throw new Error(`Seed references unknown catalog item ${catalogItemId}`);
  return {
    kind: item.kind,
    label,
    xMm,
    yMm,
    widthMm: item.widthMm,
    heightMm: item.heightMm,
    rotationDeg: 0,
    locked,
    capacity: item.capacity,
    unitCostCents: item.unitCostCents,
    catalogItemId: item.id,
  };
}

function theatreChairs(): ObjectDraft[] {
  const chair = catalogItem("chair-standard");
  if (!chair) throw new Error("Seed needs the standard chair");
  return ROWS.flatMap((row, rowIndex) =>
    BLOCK_LEFT_X.flatMap((blockX, blockIndex) =>
      Array.from({ length: SEATS_PER_BLOCK }, (_, seatIndex) =>
        draft(
          chair.id,
          `Chair ${row}${blockIndex * SEATS_PER_BLOCK + seatIndex + 1}`,
          blockX + seatIndex * chair.widthMm,
          FIRST_ROW_Y + rowIndex * ROW_PITCH_MM,
        ),
      ),
    ),
  );
}

export function novaObjects(): ObjectDraft[] {
  return [
    draft("stage-5x3", "Presentation stage", 6_500, 250),
    draft("screen-display", "Display screen left", 4_500, 1_250),
    draft("screen-display", "Display screen right", 12_000, 1_250),
    draft("desk-registration", "Registration desk", 8_000, 11_250),
    draft("station-refreshment", "Refreshment station", 1_500, 11_250),
    draft("exit-zone", "Exit west", 0, 9_500, true),
    draft("exit-zone", "Exit east", 17_000, 9_500, true),
    draft("obstacle-pillar", "Structural pillar", 16_000, 6_000, true),
    ...theatreChairs(),
  ];
}

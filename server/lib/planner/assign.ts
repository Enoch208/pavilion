import type { CatalogItem } from "../../../shared/catalog.js";
import type { PlacedObject } from "../../../shared/contracts/layout.js";
import type { Seat } from "./types.js";

const byPosition = (
  a: { xMm: number; yMm: number },
  b: { xMm: number; yMm: number },
) => a.yMm - b.yMm || a.xMm - b.xMm;

export function rowLetter(index: number): string {
  const letter = String.fromCharCode(65 + (index % 26));
  return index < 26
    ? letter
    : `${rowLetter(Math.floor(index / 26) - 1)}${letter}`;
}

function labelsFor(seats: readonly Seat[], item: CatalogItem): string[] {
  if (item.kind !== "chair") {
    return seats.map((_, index) => `${item.name} ${index + 1}`);
  }
  const rows = [...new Set(seats.map((seat) => seat.row))].sort(
    (a, b) => a - b,
  );
  const counters = new Map<number, number>();
  return seats.map((seat) => {
    const number = (counters.get(seat.row) ?? 0) + 1;
    counters.set(seat.row, number);
    return `Chair ${rowLetter(rows.indexOf(seat.row))}${number}`;
  });
}

export type Assignment = {
  objects: PlacedObject[];
  added: number;
  removed: number;
  moved: number;
  unchanged: number;
};

export function assignSeats(input: {
  seats: readonly Seat[];
  previous: readonly PlacedObject[];
  item: CatalogItem;
  newId: () => string;
}): Assignment {
  const seats = [...input.seats].sort(byPosition);
  const labels = labelsFor(seats, input.item);
  const reusable = input.previous.filter(
    (object) => object.catalogItemId === input.item.id,
  );
  const atPosition = new Map(
    reusable.map((object) => [`${object.xMm},${object.yMm}`, object]),
  );
  const ids: (string | null)[] = seats.map((seat) => {
    const match = atPosition.get(`${seat.xMm},${seat.yMm}`);
    if (!match) return null;
    atPosition.delete(`${seat.xMm},${seat.yMm}`);
    return match.id;
  });
  const unchanged = ids.filter((id) => id !== null).length;
  const leftovers = [...atPosition.values()].sort(byPosition);
  let moved = 0;
  const objects = seats.map((seat, index): PlacedObject => {
    let id = ids[index];
    if (!id && leftovers.length > 0) {
      id = leftovers.shift()!.id;
      moved += 1;
    }
    return {
      id: id ?? input.newId(),
      kind: input.item.kind,
      label: labels[index]!,
      xMm: seat.xMm,
      yMm: seat.yMm,
      widthMm: input.item.widthMm,
      heightMm: input.item.heightMm,
      rotationDeg: 0,
      locked: false,
      capacity: input.item.capacity,
      unitCostCents: input.item.unitCostCents,
      catalogItemId: input.item.id,
    };
  });
  const reused = unchanged + moved;
  return {
    objects,
    added: seats.length - reused,
    removed: input.previous.length - reused,
    moved,
    unchanged,
  };
}

import type { PlacedObject } from "../contracts/layout.js";

export type LayoutDiff = {
  added: ReadonlySet<string>;
  moved: ReadonlySet<string>;
  removed: PlacedObject[];
};

function samePlacement(a: PlacedObject, b: PlacedObject): boolean {
  return (
    a.xMm === b.xMm &&
    a.yMm === b.yMm &&
    a.widthMm === b.widthMm &&
    a.heightMm === b.heightMm &&
    a.rotationDeg === b.rotationDeg
  );
}

export function diffLayouts(
  current: readonly PlacedObject[],
  proposed: readonly PlacedObject[],
): LayoutDiff {
  const before = new Map(current.map((object) => [object.id, object]));
  const after = new Set(proposed.map((object) => object.id));
  const added = new Set<string>();
  const moved = new Set<string>();
  for (const object of proposed) {
    const previous = before.get(object.id);
    if (!previous) added.add(object.id);
    else if (!samePlacement(previous, object)) moved.add(object.id);
  }
  return {
    added,
    moved,
    removed: current.filter((object) => !after.has(object.id)),
  };
}

export const ROTATIONS = [0, 90, 180, 270] as const;
export type Rotation = (typeof ROTATIONS)[number];

export type CollisionClass = "solid" | "keepClear" | "overlay";

export type Rect = { x: number; y: number; width: number; height: number };

export type VenueSize = { widthMm: number; heightMm: number };

export type Shape = {
  id: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rotationDeg: Rotation;
  collision: CollisionClass;
};

export const GRID_MM = 250;

export function isQuarterTurn(rotationDeg: Rotation): boolean {
  return rotationDeg === 90 || rotationDeg === 270;
}

export function footprint(shape: Omit<Shape, "id" | "collision">): Rect {
  const swap = isQuarterTurn(shape.rotationDeg);
  return {
    x: shape.xMm,
    y: shape.yMm,
    width: swap ? shape.heightMm : shape.widthMm,
    height: swap ? shape.widthMm : shape.heightMm,
  };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

export function insideVenue(rect: Rect, venue: VenueSize): boolean {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.width <= venue.widthMm &&
    rect.y + rect.height <= venue.heightMm
  );
}

export function canOverlap(a: CollisionClass, b: CollisionClass): boolean {
  if (a === "overlay" || b === "overlay") return true;
  return a === "keepClear" && b === "keepClear";
}

export function snapToGrid(valueMm: number, gridMm = GRID_MM): number {
  return Math.round(valueMm / gridMm) * gridMm;
}

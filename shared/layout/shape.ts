import { collisionFor } from "../catalog.js";
import type { PlacedObject } from "../contracts/layout.js";
import type { Shape } from "../geometry/index.js";

export function toShape(object: PlacedObject): Shape {
  return {
    id: object.id,
    xMm: object.xMm,
    yMm: object.yMm,
    widthMm: object.widthMm,
    heightMm: object.heightMm,
    rotationDeg: object.rotationDeg,
    collision: collisionFor(object.kind),
  };
}

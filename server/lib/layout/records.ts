import { collisionFor } from "../../../shared/catalog.js";
import { PlacedObject } from "../../../shared/contracts/layout.js";
import type { Shape } from "../../../shared/geometry/index.js";
import type { schema } from "../../db/index.js";

export type ObjectRow = typeof schema.placedObjects.$inferSelect;
export type PlanRow = typeof schema.layoutPlans.$inferSelect;
export type VenueRow = typeof schema.venues.$inferSelect;

export function toPlacedObject(row: ObjectRow): PlacedObject {
  return PlacedObject.parse({
    id: row.id,
    kind: row.kind,
    label: row.label,
    xMm: row.xMm,
    yMm: row.yMm,
    widthMm: row.widthMm,
    heightMm: row.heightMm,
    rotationDeg: row.rotationDeg,
    locked: row.locked,
    capacity: row.capacity,
    unitCostCents: row.unitCostCents,
    catalogItemId: row.catalogItemId,
  });
}

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

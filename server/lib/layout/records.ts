import { PlacedObject } from "../../../shared/contracts/layout.js";
import type { schema } from "../../db/index.js";

export { toShape } from "../../../shared/layout/shape.js";

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

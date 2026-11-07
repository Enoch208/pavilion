import { randomUUID } from "node:crypto";

import { catalogItem, type CatalogItem } from "../../../shared/catalog.js";
import { collisionFor } from "../../../shared/catalog.js";
import type { PlacedObject } from "../../../shared/contracts/layout.js";
import {
  findFreeSpot,
  isQuarterTurn,
  type Rotation,
} from "../../../shared/geometry/index.js";
import { schema } from "../../db/index.js";
import { reject } from "../errors.js";
import type { Scope } from "../scope.js";
import { assertPlaceable, recordChange } from "./commit.js";
import { labelList, withPlan } from "./edit.js";
import { toShape } from "./records.js";

export type AddRequest = {
  catalogItemId: string;
  xMm?: number | undefined;
  yMm?: number | undefined;
  rotationDeg?: Rotation | undefined;
  label?: string | undefined;
};

function requireItem(id: string): CatalogItem {
  return (
    catalogItem(id) ??
    reject(
      "INPUT_INVALID",
      `"${id}" is not in the catalog. Use an id from get-catalog.`,
      {
        catalogItemId: id,
      },
    )
  );
}

function nextLabel(item: CatalogItem, placed: readonly PlacedObject[]) {
  const count = placed.filter(
    (object) => object.catalogItemId === item.id,
  ).length;
  return `${item.name} ${count + 1}`;
}

function positionFor(
  request: AddRequest,
  item: CatalogItem,
  placed: readonly PlacedObject[],
  venue: { widthMm: number; heightMm: number },
) {
  if (request.xMm !== undefined && request.yMm !== undefined) {
    return { xMm: request.xMm, yMm: request.yMm };
  }
  const swap = isQuarterTurn(request.rotationDeg ?? 0);
  const spot = findFreeSpot(
    {
      widthMm: swap ? item.heightMm : item.widthMm,
      heightMm: swap ? item.widthMm : item.heightMm,
      collision: collisionFor(item.kind),
    },
    placed.map(toShape),
    venue,
  );
  return (
    spot ??
    reject(
      "LAYOUT_INVALID",
      `There is no free floor space left for ${item.name}.`,
      {
        catalogItemId: item.id,
      },
    )
  );
}

export function addObjects(
  scope: Scope,
  input: { planId: string; expectedVersion: number; objects: AddRequest[] },
) {
  return withPlan(scope, input, async ({ tx, plan, venue, objects }) => {
    const placed = [...objects];
    const added: PlacedObject[] = [];
    for (const request of input.objects) {
      const item = requireItem(request.catalogItemId);
      const object: PlacedObject = {
        id: randomUUID(),
        kind: item.kind,
        label: request.label ?? nextLabel(item, placed),
        ...positionFor(request, item, placed, venue),
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        rotationDeg: request.rotationDeg ?? 0,
        locked: false,
        capacity: item.capacity,
        unitCostCents: item.unitCostCents,
        catalogItemId: item.id,
      };
      placed.push(object);
      added.push(object);
    }
    assertPlaceable(venue, placed, new Set(added.map((object) => object.id)));
    await tx.insert(schema.placedObjects).values(
      added.map((object) => ({
        ...object,
        planId: plan.id,
        ownerEmail: scope.ownerEmail,
      })),
    );
    const version = await recordChange(tx, scope, plan, {
      action: "add-objects",
      summary: `Added ${labelList(added)}`,
      payload: { objectIds: added.map((object) => object.id) },
    });
    return { planId: plan.id, version, objects: added };
  });
}

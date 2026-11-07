import type { LayoutView, PlacedObject } from "@shared/contracts/layout";
import { findIssues } from "@shared/geometry";
import { toShape } from "@shared/layout/shape";
import { summarizeLayout } from "@shared/layout/summary";

export type Move = { objectId: string; xMm: number; yMm: number };

export function withObjects(
  view: LayoutView,
  objects: PlacedObject[],
): LayoutView {
  return {
    ...view,
    plan: { ...view.plan, version: view.plan.version + 1 },
    objects,
    summary: summarizeLayout({
      attendeeTarget: view.event.attendeeTarget,
      budgetCents: view.event.budgetCents,
      objects,
    }),
    issues: findIssues(objects.map(toShape), view.venue),
  };
}

export function applyMoves(view: LayoutView, moves: readonly Move[]) {
  const byId = new Map(moves.map((move) => [move.objectId, move]));
  return withObjects(
    view,
    view.objects.map((object) => {
      const move = byId.get(object.id);
      return move ? { ...object, xMm: move.xMm, yMm: move.yMm } : object;
    }),
  );
}

export function applyPatch(
  view: LayoutView,
  objectId: string,
  patch: Partial<PlacedObject>,
) {
  return withObjects(
    view,
    view.objects.map((object) =>
      object.id === objectId ? { ...object, ...patch } : object,
    ),
  );
}

export function applyLock(
  view: LayoutView,
  objectIds: readonly string[],
  locked: boolean,
) {
  const ids = new Set(objectIds);
  return withObjects(
    view,
    view.objects.map((object) =>
      ids.has(object.id) ? { ...object, locked } : object,
    ),
  );
}

export function applyRemoval(view: LayoutView, objectIds: readonly string[]) {
  const ids = new Set(objectIds);
  return withObjects(
    view,
    view.objects.filter((object) => !ids.has(object.id)),
  );
}

import type { LayoutView } from "@shared/contracts/layout";
import { describeIssues } from "@shared/layout/describe";

import { applyMoves, type Move } from "./optimistic";

export type MoveCheck =
  | { ok: true }
  | { ok: false; reason: "locked"; label: string }
  | { ok: false; reason: "invalid"; message: string };

export function checkMoves(
  view: LayoutView,
  moves: readonly Move[],
): MoveCheck {
  const ids = new Set(moves.map((move) => move.objectId));
  const locked = view.objects.find(
    (object) => ids.has(object.id) && object.locked,
  );
  if (locked) return { ok: false, reason: "locked", label: locked.label };
  const issues = applyMoves(view, moves).issues.filter((issue) =>
    issue.objectIds.some((id) => ids.has(id)),
  );
  if (issues.length === 0) return { ok: true };
  const labels = new Map(
    view.objects.map((object) => [object.id, object.label]),
  );
  return {
    ok: false,
    reason: "invalid",
    message: describeIssues(issues, (id) => labels.get(id) ?? id, ids),
  };
}

const ARROW_STEPS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export function arrowMoves(
  view: LayoutView,
  selectedIds: readonly string[],
  key: string,
  stepMm: number,
): Move[] | null {
  const direction = ARROW_STEPS[key];
  if (!direction) return null;
  const ids = new Set(selectedIds);
  return view.objects
    .filter((object) => ids.has(object.id))
    .map((object) => ({
      objectId: object.id,
      xMm: object.xMm + direction[0] * stepMm,
      yMm: object.yMm + direction[1] * stepMm,
    }));
}

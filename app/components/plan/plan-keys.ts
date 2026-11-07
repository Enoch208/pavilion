import type { PlacedObject } from "@shared/contracts/layout";
import type { LayoutView } from "@shared/contracts/view";
import type { KeyboardEvent } from "react";

import type { Move } from "./optimistic";
import { arrowMoves } from "./plan-guards";

const NUDGE_MM = 250;
const SHIFT_NUDGE_MM = 1_000;

type Handlers = {
  layout: LayoutView;
  selected: PlacedObject[];
  clearSelection: () => void;
  move: (moves: Move[]) => void;
  rotate: (object: PlacedObject) => void;
  toggleLock: (objects: PlacedObject[]) => void;
  requestRemove: (ids: string[]) => void;
};

export function planKeyHandler(handlers: Handlers) {
  return (event: KeyboardEvent<SVGSVGElement>) => {
    const { selected } = handlers;
    if (event.key === "Escape") return handlers.clearSelection();
    if (selected.length === 0) return;
    const moves = arrowMoves(
      handlers.layout,
      selected.map((object) => object.id),
      event.key,
      event.shiftKey ? SHIFT_NUDGE_MM : NUDGE_MM,
    );
    if (moves) {
      event.preventDefault();
      return handlers.move(moves);
    }
    const key = event.key.toLowerCase();
    const [only] = selected;
    if (key === "r" && only && selected.length === 1 && !only.locked) {
      handlers.rotate(only);
    } else if (key === "l") {
      handlers.toggleLock(selected);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      handlers.requestRemove(selected.map((object) => object.id));
    }
  };
}

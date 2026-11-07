import type { PlacedObject } from "@shared/contracts/layout";
import { footprint, rectsOverlap, snapToGrid } from "@shared/geometry";
import { useRef, useState, type PointerEvent, type RefObject } from "react";

import type { Move } from "./optimistic";

const CLICK_TOLERANCE_MM = 100;

export type Drag =
  | {
      kind: "move";
      ids: string[];
      startX: number;
      startY: number;
      dx: number;
      dy: number;
      lockedLabel: string | null;
      travelled: boolean;
    }
  | {
      kind: "marquee";
      startX: number;
      startY: number;
      x: number;
      y: number;
      additive: boolean;
    };

type Options = {
  svgRef: RefObject<SVGSVGElement | null>;
  objects: readonly PlacedObject[];
  selectedIds: readonly string[];
  onSelect: (ids: string[]) => void;
  onDrop: (moves: Move[]) => void;
  onLockedDrag: (label: string) => void;
};

function toWorld(svg: SVGSVGElement, event: PointerEvent) {
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
    matrix.inverse(),
  );
  return { x: point.x, y: point.y };
}

function isAdditive(event: PointerEvent) {
  return event.shiftKey || event.metaKey || event.ctrlKey;
}

export function marqueeRect(drag: Extract<Drag, { kind: "marquee" }>) {
  return {
    x: Math.min(drag.startX, drag.x),
    y: Math.min(drag.startY, drag.y),
    width: Math.abs(drag.x - drag.startX),
    height: Math.abs(drag.y - drag.startY),
  };
}

export function useCanvasPointer(options: Options) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);

  function update(next: Drag | null) {
    dragRef.current = next;
    setDrag(next);
  }

  function capture(event: PointerEvent) {
    options.svgRef.current?.setPointerCapture(event.pointerId);
  }

  function onObjectPointerDown(id: string, event: PointerEvent) {
    const svg = options.svgRef.current;
    if (!svg || event.button !== 0) return;
    event.stopPropagation();
    if (isAdditive(event)) {
      const selected = options.selectedIds.includes(id);
      options.onSelect(
        selected
          ? options.selectedIds.filter((other) => other !== id)
          : [...options.selectedIds, id],
      );
      return;
    }
    const ids = options.selectedIds.includes(id)
      ? [...options.selectedIds]
      : [id];
    if (!options.selectedIds.includes(id)) options.onSelect(ids);
    const locked = options.objects.find(
      (object) => ids.includes(object.id) && object.locked,
    );
    const start = toWorld(svg, event);
    capture(event);
    update({
      kind: "move",
      ids,
      startX: start.x,
      startY: start.y,
      dx: 0,
      dy: 0,
      lockedLabel: locked?.label ?? null,
      travelled: false,
    });
  }

  function onCanvasPointerDown(event: PointerEvent) {
    const svg = options.svgRef.current;
    if (!svg || event.button !== 0) return;
    const start = toWorld(svg, event);
    capture(event);
    update({
      kind: "marquee",
      startX: start.x,
      startY: start.y,
      x: start.x,
      y: start.y,
      additive: isAdditive(event),
    });
  }

  function onPointerMove(event: PointerEvent) {
    const svg = options.svgRef.current;
    const current = dragRef.current;
    if (!svg || !current) return;
    const point = toWorld(svg, event);
    if (current.kind === "marquee") {
      update({ ...current, x: point.x, y: point.y });
      return;
    }
    const rawX = point.x - current.startX;
    const rawY = point.y - current.startY;
    const travelled =
      current.travelled || Math.hypot(rawX, rawY) > CLICK_TOLERANCE_MM;
    const frozen = current.lockedLabel !== null;
    update({
      ...current,
      travelled,
      dx: frozen ? 0 : snapToGrid(rawX),
      dy: frozen ? 0 : snapToGrid(rawY),
    });
  }

  function finishMarquee(current: Extract<Drag, { kind: "marquee" }>) {
    const area = marqueeRect(current);
    if (area.width < CLICK_TOLERANCE_MM && area.height < CLICK_TOLERANCE_MM) {
      if (!current.additive) options.onSelect([]);
      return;
    }
    const hit = options.objects
      .filter((object) => rectsOverlap(footprint(object), area))
      .map((object) => object.id);
    options.onSelect(
      current.additive ? [...new Set([...options.selectedIds, ...hit])] : hit,
    );
  }

  function finishMove(current: Extract<Drag, { kind: "move" }>) {
    if (current.lockedLabel !== null) {
      if (current.travelled) options.onLockedDrag(current.lockedLabel);
      return;
    }
    if (current.dx === 0 && current.dy === 0) return;
    const ids = new Set(current.ids);
    options.onDrop(
      options.objects
        .filter((object) => ids.has(object.id))
        .map((object) => ({
          objectId: object.id,
          xMm: object.xMm + current.dx,
          yMm: object.yMm + current.dy,
        })),
    );
  }

  function onPointerUp(event: PointerEvent) {
    const current = dragRef.current;
    options.svgRef.current?.releasePointerCapture(event.pointerId);
    update(null);
    if (!current) return;
    if (current.kind === "marquee") finishMarquee(current);
    else finishMove(current);
  }

  return {
    drag,
    onObjectPointerDown,
    onCanvasPointerDown,
    onPointerMove,
    onPointerUp,
  };
}

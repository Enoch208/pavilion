import { useT } from "@agent-native/core/client/i18n";
import type { LayoutView } from "@shared/contracts/view";
import { findIssues } from "@shared/geometry";
import { toShape } from "@shared/layout/shape";
import { useMemo, useRef, type KeyboardEvent } from "react";

import { metres } from "./format";
import type { Move } from "./optimistic";
import { PlanObjectShape } from "./PlanObjectShape";
import { marqueeRect, useCanvasPointer, type Drag } from "./use-canvas-pointer";

const MARGIN_MM = 600;
const GRID_LINE_MM = 1_000;

type Props = {
  view: LayoutView;
  selectedIds: readonly string[];
  onSelect: (ids: string[]) => void;
  onDrop: (moves: Move[]) => void;
  onLockedDrag: (label: string) => void;
  onKeyDown: (event: KeyboardEvent<SVGSVGElement>) => void;
};

function previewConflicts(view: LayoutView, drag: Drag | null) {
  if (drag?.kind !== "move" || (drag.dx === 0 && drag.dy === 0)) {
    return new Set(view.issues.flatMap((issue) => issue.objectIds));
  }
  const moving = new Set(drag.ids);
  const shapes = view.objects.map((object) =>
    toShape(
      moving.has(object.id)
        ? { ...object, xMm: object.xMm + drag.dx, yMm: object.yMm + drag.dy }
        : object,
    ),
  );
  return new Set(
    findIssues(shapes, view.venue, moving).flatMap((issue) => issue.objectIds),
  );
}

export function FloorPlanCanvas(props: Props) {
  const t = useT();
  const svgRef = useRef<SVGSVGElement>(null);
  const { view } = props;
  const pointer = useCanvasPointer({
    svgRef,
    objects: view.objects,
    selectedIds: props.selectedIds,
    onSelect: props.onSelect,
    onDrop: props.onDrop,
    onLockedDrag: props.onLockedDrag,
  });
  const { drag } = pointer;
  const selected = useMemo(
    () => new Set(props.selectedIds),
    [props.selectedIds],
  );
  const conflicts = useMemo(() => previewConflicts(view, drag), [view, drag]);
  const moving = drag?.kind === "move" ? new Set(drag.ids) : null;
  const { widthMm, heightMm } = view.venue;
  const ordered = [...view.objects].sort(
    (a, b) => Number(a.kind !== "zone") - Number(b.kind !== "zone"),
  );

  return (
    <svg
      ref={svgRef}
      role="application"
      tabIndex={0}
      aria-label={t("plan.canvasLabel", {
        venue: view.venue.name,
        width: metres(widthMm),
        depth: metres(heightMm),
      })}
      aria-describedby="floor-plan-keys"
      viewBox={`${-MARGIN_MM} ${-MARGIN_MM} ${widthMm + MARGIN_MM * 2} ${heightMm + MARGIN_MM * 2}`}
      preserveAspectRatio="xMidYMid meet"
      className="size-full touch-none select-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onPointerDown={pointer.onCanvasPointerDown}
      onPointerMove={pointer.onPointerMove}
      onPointerUp={pointer.onPointerUp}
      onPointerCancel={pointer.onPointerUp}
      onKeyDown={props.onKeyDown}
    >
      <defs>
        <pattern
          id="floor-grid"
          width={GRID_LINE_MM}
          height={GRID_LINE_MM}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${GRID_LINE_MM} 0 L 0 0 0 ${GRID_LINE_MM}`}
            className="fill-none stroke-border"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </pattern>
      </defs>
      <rect
        x={0}
        y={0}
        width={widthMm}
        height={heightMm}
        className="fill-background"
      />
      <rect
        x={0}
        y={0}
        width={widthMm}
        height={heightMm}
        fill="url(#floor-grid)"
      />
      <rect
        x={0}
        y={0}
        width={widthMm}
        height={heightMm}
        className="fill-none stroke-foreground"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      {ordered.map((object) => (
        <PlanObjectShape
          key={object.id}
          object={object}
          offset={moving?.has(object.id) && drag?.kind === "move" ? drag : null}
          selected={selected.has(object.id)}
          conflicted={conflicts.has(object.id)}
          onPointerDown={pointer.onObjectPointerDown}
        />
      ))}
      {drag?.kind === "marquee" ? (
        <rect
          {...marqueeRect(drag)}
          className="pointer-events-none fill-primary/10 stroke-primary"
          strokeDasharray="4 3"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      <text
        x={widthMm / 2}
        y={heightMm + MARGIN_MM * 0.6}
        textAnchor="middle"
        className="pointer-events-none fill-muted-foreground"
        fontSize={260}
      >
        {`${metres(widthMm)} m × ${metres(heightMm)} m`}
      </text>
    </svg>
  );
}

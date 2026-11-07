import { useT } from "@agent-native/core/client/i18n";
import type { PlacedObject } from "@shared/contracts/layout";
import type { LayoutView } from "@shared/contracts/view";
import { findIssues } from "@shared/geometry";
import type { LayoutDiff } from "@shared/layout/diff";
import { toShape } from "@shared/layout/shape";
import { useMemo, useRef, type KeyboardEvent } from "react";

import { metres } from "./format";
import type { Move } from "./optimistic";
import { PlanObjectShape, type ObjectChange } from "./PlanObjectShape";
import { marqueeRect, useCanvasPointer, type Drag } from "./use-canvas-pointer";

const MARGIN_MM = 600;
const GRID_LINE_MM = 1_000;

export type Review = { objects: PlacedObject[]; diff: LayoutDiff };

type Props = {
  view: LayoutView;
  review: Review | null;
  selectedIds: readonly string[];
  onSelect: (ids: string[]) => void;
  onDrop: (moves: Move[]) => void;
  onLockedDrag: (label: string) => void;
  onKeyDown: (event: KeyboardEvent<SVGSVGElement>) => void;
};

function changeOf(review: Review | null, id: string): ObjectChange | null {
  if (!review) return null;
  if (review.diff.added.has(id)) return "added";
  if (review.diff.moved.has(id)) return "moved";
  return null;
}

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
  const { review } = props;
  const conflicts = useMemo(
    () => (review ? new Set<string>() : previewConflicts(view, drag)),
    [view, drag, review],
  );
  const moving = drag?.kind === "move" ? new Set(drag.ids) : null;
  const { widthMm, heightMm } = view.venue;
  const ordered = [...(review?.objects ?? view.objects)].sort(
    (a, b) => Number(a.kind !== "zone") - Number(b.kind !== "zone"),
  );
  const interactive = review === null;

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
      onPointerDown={interactive ? pointer.onCanvasPointerDown : undefined}
      onPointerMove={interactive ? pointer.onPointerMove : undefined}
      onPointerUp={interactive ? pointer.onPointerUp : undefined}
      onPointerCancel={interactive ? pointer.onPointerUp : undefined}
      onKeyDown={interactive ? props.onKeyDown : undefined}
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
          selected={interactive && selected.has(object.id)}
          conflicted={conflicts.has(object.id)}
          change={changeOf(review, object.id)}
          onPointerDown={interactive ? pointer.onObjectPointerDown : null}
        />
      ))}
      {review?.diff.removed.map((object) => (
        <PlanObjectShape
          key={`removed-${object.id}`}
          object={object}
          offset={null}
          selected={false}
          conflicted={false}
          change="removed"
          onPointerDown={null}
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

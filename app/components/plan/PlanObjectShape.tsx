import type { PlacedObject } from "@shared/contracts/layout";
import { footprint } from "@shared/geometry";
import type { PointerEvent } from "react";

import { cn } from "@/lib/utils";

const FILL_BY_KIND: Record<PlacedObject["kind"], string> = {
  stage: "fill-muted stroke-foreground/70",
  chair: "fill-card stroke-muted-foreground",
  "round-table": "fill-card stroke-muted-foreground",
  "registration-desk": "fill-secondary stroke-foreground/60",
  "refreshment-station": "fill-secondary stroke-foreground/60",
  "display-screen": "fill-foreground/80 stroke-foreground",
  zone: "fill-primary/5 stroke-primary/60",
  "exit-zone": "fill-emerald-500/15 stroke-emerald-600",
  obstacle: "fill-foreground/70 stroke-foreground",
};

const LABEL_KINDS = new Set<PlacedObject["kind"]>([
  "stage",
  "registration-desk",
  "refreshment-station",
  "zone",
  "exit-zone",
  "round-table",
]);

type Props = {
  object: PlacedObject;
  offset: { dx: number; dy: number } | null;
  selected: boolean;
  conflicted: boolean;
  onPointerDown: (id: string, event: PointerEvent) => void;
};

export function PlanObjectShape(props: Props) {
  const { object } = props;
  const rect = footprint({
    ...object,
    xMm: object.xMm + (props.offset?.dx ?? 0),
    yMm: object.yMm + (props.offset?.dy ?? 0),
  });
  const round = object.kind === "round-table";
  const shapeClass = cn(
    FILL_BY_KIND[object.kind],
    props.conflicted && "fill-destructive/30 stroke-destructive",
    props.selected && !props.conflicted && "stroke-primary",
  );
  const strokeWidth = props.selected || props.conflicted ? 2.5 : 1;
  const dash = object.locked || object.kind === "zone" ? "6 4" : undefined;
  const state = [
    object.locked ? "locked" : null,
    props.conflicted ? "conflict" : null,
  ].filter(Boolean);

  return (
    <g
      data-object-id={object.id}
      className={cn(
        "cursor-grab",
        object.locked && "cursor-not-allowed",
        props.offset && "cursor-grabbing",
      )}
      onPointerDown={(event) => props.onPointerDown(object.id, event)}
    >
      <title>{[object.label, ...state].join(", ")}</title>
      {round ? (
        <ellipse
          cx={rect.x + rect.width / 2}
          cy={rect.y + rect.height / 2}
          rx={rect.width / 2}
          ry={rect.height / 2}
          className={shapeClass}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          rx={object.kind === "chair" ? 80 : 40}
          className={shapeClass}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {LABEL_KINDS.has(object.kind) && rect.width >= 1_000 ? (
        <text
          x={rect.x + rect.width / 2}
          y={rect.y + rect.height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none select-none fill-foreground"
          fontSize={Math.min(
            320,
            rect.height * 0.35,
            (rect.width * 0.9) / (object.label.length * 0.6),
          )}
        >
          {object.label}
        </text>
      ) : null}
    </g>
  );
}

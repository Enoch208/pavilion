import type { LayoutView } from "@shared/contracts/view";

import { PlanObjectShape } from "@/components/plan/PlanObjectShape";

const MARGIN_MM = 400;

export function PlanThumbnail({ view }: { view: LayoutView }) {
  const { widthMm, heightMm } = view.venue;
  const ordered = [...view.objects].sort(
    (a, b) => Number(a.kind !== "zone") - Number(b.kind !== "zone"),
  );
  return (
    <svg
      aria-hidden
      viewBox={`${-MARGIN_MM} ${-MARGIN_MM} ${widthMm + MARGIN_MM * 2} ${heightMm + MARGIN_MM * 2}`}
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none size-full"
    >
      <rect
        x={0}
        y={0}
        width={widthMm}
        height={heightMm}
        className="fill-background stroke-foreground/70"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      {ordered.map((object) => (
        <PlanObjectShape
          key={object.id}
          object={object}
          offset={null}
          selected={false}
          conflicted={false}
          change={null}
          onPointerDown={null}
        />
      ))}
    </svg>
  );
}

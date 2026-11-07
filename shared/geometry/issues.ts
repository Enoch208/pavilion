import {
  canOverlap,
  footprint,
  insideVenue,
  rectsOverlap,
  type Shape,
  type VenueSize,
} from "./shapes.js";

export type LayoutIssue =
  | { code: "OUT_OF_BOUNDS"; objectIds: [string] }
  | { code: "COLLISION"; objectIds: [string, string] };

function involves(focus: ReadonlySet<string> | undefined, ...ids: string[]) {
  return !focus || ids.some((id) => focus.has(id));
}

export function findIssues(
  shapes: readonly Shape[],
  venue: VenueSize,
  focus?: ReadonlySet<string>,
): LayoutIssue[] {
  const rects = shapes.map(footprint);
  const issues: LayoutIssue[] = [];
  shapes.forEach((shape, index) => {
    if (involves(focus, shape.id) && !insideVenue(rects[index]!, venue)) {
      issues.push({ code: "OUT_OF_BOUNDS", objectIds: [shape.id] });
    }
  });
  for (let i = 0; i < shapes.length; i += 1) {
    for (let j = i + 1; j < shapes.length; j += 1) {
      const a = shapes[i]!;
      const b = shapes[j]!;
      if (!involves(focus, a.id, b.id)) continue;
      if (canOverlap(a.collision, b.collision)) continue;
      if (rectsOverlap(rects[i]!, rects[j]!)) {
        issues.push({ code: "COLLISION", objectIds: [a.id, b.id] });
      }
    }
  }
  return issues;
}

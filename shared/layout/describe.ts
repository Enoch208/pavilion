import type { LayoutIssue } from "../geometry/index.js";

export function describeIssue(
  issue: LayoutIssue,
  labelOf: (objectId: string) => string,
): string {
  if (issue.code === "OUT_OF_BOUNDS") {
    return `${labelOf(issue.objectIds[0])} would extend past the venue walls.`;
  }
  const [a, b] = issue.objectIds;
  return `${labelOf(a)} and ${labelOf(b)} would overlap.`;
}

export function describeIssues(
  issues: readonly LayoutIssue[],
  labelOf: (objectId: string) => string,
): string {
  const shown = issues
    .slice(0, 3)
    .map((issue) => describeIssue(issue, labelOf));
  const more = issues.length - shown.length;
  return more > 0
    ? `${shown.join(" ")} ${more} more conflict${more === 1 ? "" : "s"}.`
    : shown.join(" ");
}

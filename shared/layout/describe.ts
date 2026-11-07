import type { LayoutIssue } from "../geometry/index.js";

const NAMES_SHOWN = 3;

function nameList(names: readonly string[]): string {
  const shown = names.slice(0, NAMES_SHOWN);
  const more = names.length - shown.length;
  if (more > 0) return `${shown.join(", ")} and ${more} more`;
  if (shown.length <= 1) return shown.join("");
  return `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}`;
}

export function describeIssues(
  issues: readonly LayoutIssue[],
  labelOf: (objectId: string) => string,
  movedIds: ReadonlySet<string> = new Set(),
): string {
  const sentences: string[] = [];
  const overlaps = new Map<string, string[]>();
  for (const issue of issues) {
    if (issue.code === "OUT_OF_BOUNDS") {
      sentences.push(
        `${labelOf(issue.objectIds[0])} would extend past the venue walls.`,
      );
      continue;
    }
    const [a, b] = issue.objectIds;
    const [mover, other] =
      movedIds.has(b) && !movedIds.has(a) ? [b, a] : [a, b];
    overlaps.set(mover, [...(overlaps.get(mover) ?? []), other]);
  }
  for (const [mover, others] of overlaps) {
    sentences.push(
      `${labelOf(mover)} would overlap ${nameList(others.map(labelOf))}.`,
    );
  }
  const shown = sentences.slice(0, NAMES_SHOWN);
  const more = sentences.length - shown.length;
  return more > 0
    ? `${shown.join(" ")} ${more} more objects would clash.`
    : shown.join(" ");
}

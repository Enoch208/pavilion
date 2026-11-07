import { describeIssues } from "@shared/layout/describe";
import { describe, expect, it } from "vitest";

const labels: Record<string, string> = {
  stage: "Presentation stage",
  a1: "Chair A1",
  a2: "Chair A2",
  a3: "Chair A3",
  a4: "Chair A4",
  desk: "Registration desk",
};
const labelOf = (id: string) => labels[id] ?? id;

describe("describeIssues", () => {
  it("names the moved object first and lists what it would hit", () => {
    expect(
      describeIssues(
        [
          { code: "COLLISION", objectIds: ["a1", "stage"] },
          { code: "COLLISION", objectIds: ["a2", "stage"] },
        ],
        labelOf,
        new Set(["stage"]),
      ),
    ).toBe("Presentation stage would overlap Chair A1 and Chair A2.");
  });

  it("summarises long lists", () => {
    expect(
      describeIssues(
        ["a1", "a2", "a3", "a4"].map((id) => ({
          code: "COLLISION" as const,
          objectIds: [id, "stage"] as [string, string],
        })),
        labelOf,
        new Set(["stage"]),
      ),
    ).toBe(
      "Presentation stage would overlap Chair A1, Chair A2, Chair A3 and 1 more.",
    );
  });

  it("reports objects past the walls", () => {
    expect(
      describeIssues([{ code: "OUT_OF_BOUNDS", objectIds: ["desk"] }], labelOf),
    ).toBe("Registration desk would extend past the venue walls.");
  });
});

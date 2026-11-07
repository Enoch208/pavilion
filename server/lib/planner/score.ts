import type { SeatingParams } from "./types.js";

export const SCORE_WEIGHTS = {
  seating: 0.35,
  circulation: 0.2,
  cost: 0.2,
  preference: 0.15,
  preservation: 0.1,
} as const;

const TIGHTEST_PITCH_MM = 850;
const PITCH_RANGE_MM = 150;
const AISLE_HEADROOM_MM = 500;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export type ScoreInput = {
  seats: number;
  attendeeTarget: number;
  params: SeatingParams;
  minAisleMm: number;
  costCents: number;
  budgetCents: number;
  meanRowDepth: number;
  unchanged: number;
  comparedWith: number;
};

export function scoreCandidate(input: ScoreInput): number {
  const seating =
    input.attendeeTarget === 0 ? 1 : clamp(input.seats / input.attendeeTarget);
  const circulation =
    0.5 * clamp(input.params.aisleMm / (input.minAisleMm + AISLE_HEADROOM_MM)) +
    0.5 * clamp((input.params.pitchMm - TIGHTEST_PITCH_MM) / PITCH_RANGE_MM);
  const cost =
    input.costCents <= input.budgetCents
      ? 1
      : clamp(
          1 -
            (input.costCents - input.budgetCents) /
              Math.max(1, input.budgetCents),
        );
  const preference = clamp(1 - input.meanRowDepth);
  const preservation =
    input.comparedWith === 0 ? 1 : clamp(input.unchanged / input.comparedWith);
  return (
    SCORE_WEIGHTS.seating * seating +
    SCORE_WEIGHTS.circulation * circulation +
    SCORE_WEIGHTS.cost * cost +
    SCORE_WEIGHTS.preference * preference +
    SCORE_WEIGHTS.preservation * preservation
  );
}

import type { PlacedObject } from "../../../shared/contracts/layout.js";
import type { Rect, VenueSize } from "../../../shared/geometry/index.js";

export type PlanningMode = "theatre" | "banquet";

export type PlanningInput = {
  venue: VenueSize;
  objects: readonly PlacedObject[];
  mode: PlanningMode;
  attendeeTarget: number;
  minAisleMm: number;
  budgetCents: number;
  newId: () => string;
};

export type Seat = { xMm: number; yMm: number; row: number };

export type SeatingParams = {
  pitchMm: number;
  aisleMm: number;
  blocks: 2 | 3;
  unitsPerBlock: number;
};

export type SeatingContext = {
  venue: VenueSize;
  minAisleMm: number;
  centreXMm: number;
  firstRowYMm: number;
  unitWidthMm: number;
  unitDepthMm: number;
  blocked: readonly Rect[];
};

export type PlanReport = {
  mode: PlanningMode;
  attendeeTarget: number;
  minAisleMm: number;
  seatsBefore: number;
  seatsAfter: number;
  shortfall: number;
  costBeforeCents: number;
  costAfterCents: number;
  budgetCents: number;
  overBudget: boolean;
  added: number;
  removed: number;
  moved: number;
  kept: number;
  rows: number;
  params: SeatingParams;
  score: number;
  notes: string[];
};

export type PlanResult = {
  objects: PlacedObject[];
  report: PlanReport;
  summary: string;
};

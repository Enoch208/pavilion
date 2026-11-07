import { z } from "zod";

import { Id, PlacedObject, Version } from "./layout.js";

export const PlanningMode = z.enum(["theatre", "banquet"]);

export const PlanReport = z.object({
  mode: PlanningMode,
  attendeeTarget: z.number().int().min(0),
  minAisleMm: z.number().int().min(0),
  seatsBefore: z.number().int().min(0),
  seatsAfter: z.number().int().min(0),
  shortfall: z.number().int().min(0),
  costBeforeCents: z.number().int().min(0),
  costAfterCents: z.number().int().min(0),
  budgetCents: z.number().int().min(0),
  overBudget: z.boolean(),
  added: z.number().int().min(0),
  removed: z.number().int().min(0),
  moved: z.number().int().min(0),
  kept: z.number().int().min(0),
  rows: z.number().int().min(0),
  params: z.object({
    pitchMm: z.number().int(),
    aisleMm: z.number().int(),
    blocks: z.union([z.literal(2), z.literal(3)]),
    unitsPerBlock: z.number().int(),
  }),
  score: z.number(),
  notes: z.array(z.string()),
});
export type PlanReport = z.infer<typeof PlanReport>;

export const ProposalView = z.object({
  id: Id,
  baseVersion: Version,
  stale: z.boolean(),
  createdBy: z.enum(["human", "agent", "system"]),
  createdAt: z.string(),
  mode: PlanningMode,
  attendeeTarget: z.number().int().min(0),
  minAisleMm: z.number().int().min(0),
  summary: z.string(),
  report: PlanReport,
  objects: z.array(PlacedObject),
});
export type ProposalView = z.infer<typeof ProposalView>;

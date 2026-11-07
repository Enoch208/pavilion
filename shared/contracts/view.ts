import { z } from "zod";

import {
  Cents,
  Id,
  LayoutIssue,
  LayoutSummary,
  Mm,
  PlacedObject,
  Version,
} from "./layout.js";
import { ProposalView } from "./proposal.js";

export const LayoutView = z.object({
  event: z.object({
    id: Id,
    title: z.string(),
    eventType: z.string(),
    eventDate: z.string().nullable(),
    attendeeTarget: z.number().int().min(0),
    currency: z.string(),
    budgetCents: Cents,
    isDemo: z.boolean(),
  }),
  venue: z.object({
    name: z.string(),
    widthMm: Mm.positive(),
    heightMm: Mm.positive(),
    unitDisplay: z.enum(["m", "ft"]),
  }),
  plan: z.object({
    id: Id,
    version: Version,
    mode: z.enum(["theatre", "banquet", "workshop", "exhibition"]),
    status: z.enum(["draft", "approved"]),
    minAisleMm: z.number().int().min(0),
  }),
  objects: z.array(PlacedObject),
  summary: LayoutSummary,
  issues: z.array(LayoutIssue),
  proposal: ProposalView.nullable(),
});
export type LayoutView = z.infer<typeof LayoutView>;

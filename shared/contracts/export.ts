import { z } from "zod";

import { Cents, Mm, PlacedObject, Version } from "./layout.js";

export const PackSource = z.object({
  event: z.object({
    title: z.string(),
    eventType: z.string(),
    eventDate: z.string().nullable(),
    attendeeTarget: z.number().int().min(0),
    currency: z.string(),
    budgetCents: Cents,
  }),
  venue: z.object({
    name: z.string(),
    widthMm: Mm.positive(),
    heightMm: Mm.positive(),
  }),
  plan: z.object({
    version: Version,
    mode: z.enum(["theatre", "banquet", "workshop", "exhibition"]),
    minAisleMm: z.number().int().min(0),
  }),
  objects: z.array(PlacedObject),
  exportedAt: z.string(),
});
export type PackSource = z.infer<typeof PackSource>;

export const SetupPackRecord = z.object({
  id: z.string(),
  eventId: z.string(),
  planId: z.string(),
  version: Version,
  createdBy: z.enum(["human", "agent", "system"]),
  source: PackSource,
});
export type SetupPackRecord = z.infer<typeof SetupPackRecord>;

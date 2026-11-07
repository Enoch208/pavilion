import { z } from "zod";

import { OBJECT_KINDS } from "../catalog.js";
import { ROTATIONS } from "../geometry/index.js";

export const Id = z.string().min(1).max(64);
export const Mm = z.number().int();
export const Cents = z.number().int().min(0);
export const Version = z.number().int().min(0);
export const ObjectKind = z.enum(OBJECT_KINDS);
export const Rotation = z.union(
  ROTATIONS.map((degrees) => z.literal(degrees)) as [
    z.ZodLiteral<0>,
    z.ZodLiteral<90>,
    z.ZodLiteral<180>,
    z.ZodLiteral<270>,
  ],
);

export const PlacedObject = z.object({
  id: Id,
  kind: ObjectKind,
  label: z.string(),
  xMm: Mm,
  yMm: Mm,
  widthMm: Mm.positive(),
  heightMm: Mm.positive(),
  rotationDeg: Rotation,
  locked: z.boolean(),
  capacity: z.number().int().min(0),
  unitCostCents: Cents,
  catalogItemId: z.string().nullable(),
});
export type PlacedObject = z.infer<typeof PlacedObject>;

export const LayoutIssue = z.discriminatedUnion("code", [
  z.object({ code: z.literal("OUT_OF_BOUNDS"), objectIds: z.tuple([Id]) }),
  z.object({ code: z.literal("COLLISION"), objectIds: z.tuple([Id, Id]) }),
]);

export const LayoutSummary = z.object({
  seats: z.number().int().min(0),
  attendeeTarget: z.number().int().min(0),
  unseated: z.number().int().min(0),
  totalCostCents: Cents,
  budgetCents: Cents,
  remainingCents: z.number().int(),
  overBudget: z.boolean(),
});

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
  }),
  objects: z.array(PlacedObject),
  summary: LayoutSummary,
  issues: z.array(LayoutIssue),
});
export type LayoutView = z.infer<typeof LayoutView>;

export const LayoutChange = z.object({
  planId: Id,
  version: Version,
  objects: z.array(PlacedObject),
});
export type LayoutChange = z.infer<typeof LayoutChange>;

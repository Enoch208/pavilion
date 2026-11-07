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

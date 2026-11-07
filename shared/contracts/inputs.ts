import { z } from "zod";

export const PlanRef = {
  planId: z.string().min(1).max(64).describe("Layout plan id from get-layout"),
  expectedVersion: z.coerce
    .number()
    .int()
    .min(0)
    .describe(
      "Plan version from get-layout. The write is refused with VERSION_CONFLICT if the plan changed since.",
    ),
};

export const PositionMm = z.coerce.number().int().min(0).max(1_000_000);

export const RotationInput = z.coerce
  .number()
  .int()
  .refine((value) => [0, 90, 180, 270].includes(value), {
    message: "Rotation must be 0, 90, 180 or 270 degrees.",
  })
  .transform((value) => value as 0 | 90 | 180 | 270);

export const ObjectIds = z
  .array(z.string().min(1).max(64))
  .min(1)
  .max(500)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "Object ids must be unique.",
  });

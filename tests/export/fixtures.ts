import type { PackSource } from "@shared/contracts/export";
import type { PlacedObject } from "@shared/contracts/layout";
import { NOVA, novaObjects } from "@shared/demo/nova";

export function novaSource(
  change: (objects: PlacedObject[]) => PlacedObject[] = (objects) => objects,
): PackSource {
  return {
    event: {
      title: NOVA.title,
      eventType: NOVA.eventType,
      eventDate: null,
      attendeeTarget: NOVA.attendeeTarget,
      currency: NOVA.currency,
      budgetCents: NOVA.budgetCents,
    },
    venue: NOVA.venue,
    plan: { version: 7, mode: "theatre", minAisleMm: NOVA.minAisleMm },
    objects: change(
      novaObjects().map((object, index) => ({
        ...object,
        id: `seed-${index}`,
      })),
    ),
    exportedAt: "2026-11-08T05:50:00.000Z",
  };
}

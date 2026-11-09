import { NOVA, novaObjects } from "@shared/demo/nova";
import { buildSetupPack, type SetupPack } from "@shared/export/pack";
import { renderFloorPlanSvg } from "@shared/export/svg";

export function novaPack(): SetupPack {
  return buildSetupPack({
    event: {
      title: NOVA.title,
      eventType: NOVA.eventType,
      eventDate: null,
      attendeeTarget: NOVA.attendeeTarget,
      currency: NOVA.currency,
      budgetCents: NOVA.budgetCents,
    },
    venue: NOVA.venue,
    plan: { version: 1, mode: NOVA.mode, minAisleMm: NOVA.minAisleMm },
    objects: novaObjects().map((object, index) => ({
      ...object,
      id: `nova-${index}`,
    })),
    exportedAt: new Date(0).toISOString(),
  });
}

export function novaPreviewUrl(pack: SetupPack): string {
  const { svg } = renderFloorPlanSvg(pack, 1_200, { titled: false });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

import { writeClientAppState } from "@agent-native/core/client/hooks";
import type { PlacedObject } from "@shared/contracts/layout";
import { useEffect, useMemo, useState } from "react";

import { TAB_ID } from "@/lib/tab-id";

const PUBLISH_DELAY_MS = 150;

export function usePlanSelection(
  eventId: string,
  objects: readonly PlacedObject[] | undefined,
) {
  const [ids, setIds] = useState<string[]>([]);
  const selectedIds = useMemo(() => {
    if (!objects) return ids;
    const present = new Set(objects.map((object) => object.id));
    return ids.filter((id) => present.has(id));
  }, [ids, objects]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      writeClientAppState(
        `selection:${TAB_ID}`,
        { eventId, objectIds: selectedIds, capturedAt: Date.now() },
        { requestSource: TAB_ID },
      ).catch(() => undefined); // coercion-ok: the agent's selection context is advisory; view-screen reports ids it cannot verify
    }, PUBLISH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [eventId, selectedIds]);

  return [selectedIds, setIds] as const;
}

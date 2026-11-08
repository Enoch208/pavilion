import { appPath } from "@agent-native/core/client/api-path";
import { useState } from "react";
import { z } from "zod";

const StartResponse = z.union([
  z.object({ ok: z.literal(true), eventId: z.string().min(1) }),
  z.object({ ok: z.literal(false), error: z.string() }),
]);

type StartOutcome = { eventId: string } | { error: string | null };

async function requestSandbox(): Promise<StartOutcome> {
  const response = await fetch(appPath("/api/demo/start"), {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: "{}",
  }).catch(() => null); // coercion-ok: a network failure becomes the visible error below
  if (!response) return { error: null };
  const body: unknown = await response.json().catch(() => null); // coercion-ok: a non-JSON error page becomes the visible error below
  const parsed = StartResponse.safeParse(body);
  if (!parsed.success) return { error: null };
  return parsed.data.ok
    ? { eventId: parsed.data.eventId }
    : { error: parsed.data.error };
}

export function useStartDemo() {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState<{ message: string | null } | null>(null);

  function start() {
    if (pending) return;
    setPending(true);
    setFailed(null);
    void requestSandbox().then((outcome) => {
      if ("eventId" in outcome) {
        window.location.assign(
          appPath(`/events/${encodeURIComponent(outcome.eventId)}`),
        );
        return;
      }
      setPending(false);
      setFailed({ message: outcome.error });
    });
  }

  return { start, pending, failed };
}

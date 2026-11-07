import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import { IconArrowRight, IconLayoutBoard } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { money } from "@/components/plan/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function OpenDemoButton() {
  const t = useT();
  const navigate = useNavigate();
  const start = useActionMutation("start-demo", {
    onSuccess: (result) =>
      navigate(`/events/${encodeURIComponent(result.eventId)}`),
    onError: (error) =>
      toast.error(actionErrorMessage(error) ?? t("events.openFailed")),
  });
  return (
    <Button onClick={() => start.mutate({})} disabled={start.isPending}>
      <IconLayoutBoard className="size-4" />
      {start.isPending ? t("events.openingDemo") : t("events.openDemo")}
    </Button>
  );
}

export function EventsPage() {
  const t = useT();
  const { data, isPending } = useActionQuery("list-events", {});
  if (isPending || !data) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-2 p-6">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-lg" />
        ))}
      </main>
    );
  }
  const hasDemo = data.events.some((event) => event.isDemo);
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 p-6">
      {data.events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("events.empty")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {data.events.map((event) => (
            <li key={event.id}>
              <Link
                to={`/events/${encodeURIComponent(event.id)}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="truncate">{event.title}</span>
                    {event.isDemo ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                        {t("events.demo")}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {event.eventType} ·{" "}
                    {t("events.guests", { count: event.attendeeTarget })} ·{" "}
                    {t("events.budget", {
                      amount: money(event.budgetCents, event.currency),
                    })}
                  </span>
                </span>
                <IconArrowRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {hasDemo ? null : <OpenDemoButton />}
    </main>
  );
}

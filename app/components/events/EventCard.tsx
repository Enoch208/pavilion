import { useActionQuery } from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import { IconArrowRight } from "@tabler/icons-react";
import { Link } from "react-router";

import { metres } from "@/components/plan/format";
import { PlanMetrics } from "@/components/plan/PlanMetrics";
import { Skeleton } from "@/components/ui/skeleton";

import { PlanThumbnail } from "./PlanThumbnail";

export type EventRow = {
  id: string;
  title: string;
  eventType: string;
  isDemo: boolean;
};

export function EventCard({ event }: { event: EventRow }) {
  const t = useT();
  const { data: view } = useActionQuery("get-layout", { eventId: event.id });
  return (
    <li>
      <Link
        to={`/events/${encodeURIComponent(event.id)}`}
        className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row"
      >
        <div className="aspect-[3/2] border-b border-border bg-muted/40 p-3 sm:w-80 sm:shrink-0 sm:border-b-0 sm:border-r">
          {view ? (
            <PlanThumbnail view={view} />
          ) : (
            <Skeleton className="size-full rounded-md" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-lg font-semibold">
              <span className="truncate">{event.title}</span>
              {event.isDemo ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                  {t("events.demo")}
                </span>
              ) : null}
              {view ? (
                <span className="font-mono text-xs font-normal text-muted-foreground">
                  {t("plan.version", { version: view.plan.version })}
                </span>
              ) : null}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {view
                ? t("events.venue", {
                    type: event.eventType,
                    venue: view.venue.name,
                    width: metres(view.venue.widthMm),
                    depth: metres(view.venue.heightMm),
                  })
                : event.eventType}
            </p>
          </div>
          {view ? (
            <PlanMetrics view={view} />
          ) : (
            <Skeleton className="h-5 w-3/4" />
          )}
          <span className="mt-auto inline-flex items-center gap-1 self-end text-sm text-muted-foreground group-hover:text-foreground">
            {t("events.openPlan")}
            <IconArrowRight className="size-4" />
          </span>
        </div>
      </Link>
    </li>
  );
}

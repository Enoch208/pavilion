import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import { IconLayoutBoard } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { EventCard } from "./EventCard";

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
      <main className="mx-auto w-full max-w-4xl p-6">
        <div className="space-y-4">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-52 rounded-xl" />
          ))}
        </div>
      </main>
    );
  }
  const hasDemo = data.events.some((event) => event.isDemo);
  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 p-6">
      {data.events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("events.empty")}</p>
      ) : (
        <ul className="space-y-4">
          {data.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ul>
      )}
      {hasDemo ? null : <OpenDemoButton />}
    </main>
  );
}

import {
  actionErrorMessage,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import { IconArrowLeft, IconPrinter } from "@tabler/icons-react";
import { useMemo, useRef } from "react";
import { Link } from "react-router";

import { PlanNotFound } from "@/components/plan/PlanStates";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ExportButton } from "./ExportButton";
import { PackDownloads } from "./PackDownloads";
import { renderPack } from "./render";

type Props = { eventId: string; packId: string };

function localTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function PackSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <Skeleton className="h-12 rounded-none" />
      <div className="flex-1 p-3">
        <Skeleton className="h-full rounded-md" />
      </div>
    </div>
  );
}

export function SetupPackPage({ eventId, packId }: Props) {
  const t = useT();
  const {
    data: record,
    isPending,
    error,
  } = useActionQuery("get-setup-pack", {
    packId,
  });
  const { data: layout } = useActionQuery("get-layout", { eventId });
  const rendered = useMemo(
    () => (record ? renderPack(record.source) : null),
    [record],
  );
  const frame = useRef<HTMLIFrameElement>(null);

  if (isPending) return <PackSkeleton />;
  if (!record || !rendered) {
    return (
      <PlanNotFound message={actionErrorMessage(error) ?? t("pack.notFound")} />
    );
  }
  const current =
    layout?.plan.id === record.planId && layout.plan.version !== record.version
      ? layout.plan
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-2.5">
        <Link
          to={`/events/${encodeURIComponent(record.eventId)}`}
          aria-label={t("pack.back")}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
        </Link>
        <h1 className="min-w-0 truncate text-base font-semibold">
          {t("pack.title", { title: record.source.event.title })}
        </h1>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs tabular-nums text-muted-foreground">
          {t("plan.version", { version: record.version })}
        </span>
        <span className="text-sm text-muted-foreground">
          {t("pack.exported", { time: localTime(record.source.exportedAt) })}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <PackDownloads rendered={rendered} />
          <Button
            size="sm"
            onClick={() => frame.current?.contentWindow?.print()}
          >
            <IconPrinter className="size-4" />
            {t("pack.print")}
          </Button>
        </div>
      </header>
      {current ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/50 px-4 py-2 text-sm">
          <span>{t("pack.changed", { version: current.version })}</span>
          <ExportButton
            planId={current.id}
            version={current.version}
            label="exportAgain"
            variant="outline"
          />
        </div>
      ) : null}
      <div className="min-h-0 flex-1 bg-muted/40 p-3">
        <iframe
          ref={frame}
          title={t("pack.preview")}
          srcDoc={rendered.html}
          sandbox="allow-same-origin allow-modals"
          className="h-full min-h-[28rem] w-full rounded-md border border-border bg-white"
        />
      </div>
    </div>
  );
}

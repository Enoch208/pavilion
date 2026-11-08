import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import type { LayoutView } from "@shared/contracts/view";
import { IconHistory } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

import { ConfirmDialog } from "./PlanDialogs";

type SavedVersion = { id: string; version: number };

function time(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function HistoryPopover({
  view,
  onRestored,
}: {
  view: LayoutView;
  onRestored: () => void;
}) {
  const t = useT();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<SavedVersion | null>(null);
  const history = useActionQuery(
    "list-versions",
    { planId: view.plan.id },
    { enabled: open },
  );
  const restore = useActionMutation("restore-version", {
    uiOnly: true,
    onSuccess: (result) => {
      onRestored();
      toast.success(
        t("history.restored", {
          restored: result.restoredVersion,
          version: result.version,
        }),
      );
    },
    onError: (error) => {
      toast.error(actionErrorMessage(error) ?? t("plan.saveFailed"));
      void queryClient.invalidateQueries({
        queryKey: ["action", "get-layout"],
      });
    },
  });

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm">
            <IconHistory className="size-4" />
            {t("history.open")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          {history.isPending || !history.data ? (
            <div className="space-y-2 p-3">
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
            </div>
          ) : history.data.versions.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              {t("history.empty")}
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {history.data.versions.map((saved) => (
                <li
                  key={saved.id}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="mr-1.5 font-mono text-xs text-muted-foreground">
                        v{saved.version}
                      </span>
                      {saved.reason}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {t("history.seats", { count: saved.seats })} ·{" "}
                      {time(saved.createdAt)}
                    </p>
                  </div>
                  {saved.version === view.plan.version ? (
                    <span className="text-xs text-muted-foreground">
                      {t("history.current")}
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={t("history.restoreLabel", {
                        version: saved.version,
                      })}
                      disabled={restore.isPending}
                      onClick={() =>
                        setPending({ id: saved.id, version: saved.version })
                      }
                    >
                      {t("history.restore")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
      <ConfirmDialog
        open={pending !== null}
        title={t("history.restoreTitle", { version: pending?.version ?? 0 })}
        description={t("history.restoreDescription")}
        confirm={t("history.restore")}
        onConfirm={() => {
          if (!pending) return;
          setOpen(false);
          restore.mutate({
            versionId: pending.id,
            expectedVersion: view.plan.version,
          });
        }}
        onClose={() => setPending(null)}
      />
    </>
  );
}

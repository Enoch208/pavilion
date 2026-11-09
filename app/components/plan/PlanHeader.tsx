import { useT } from "@agent-native/core/client/i18n";
import type { LayoutView } from "@shared/contracts/view";
import { IconArrowLeft, IconDots } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PlanMetrics } from "./PlanMetrics";

type Props = { view: LayoutView; actions: ReactNode; onReset: () => void };

export function PlanHeader({ view, actions, onReset }: Props) {
  const t = useT();
  const { event } = view;
  return (
    <header className="space-y-1.5 border-b border-border px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          to="/events"
          aria-label={t("plan.backToEvents")}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
        </Link>
        <h1 className="min-w-0 truncate text-base font-semibold">
          {event.title}
        </h1>
        <span
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs tabular-nums text-muted-foreground"
          title={t("plan.versionLabel", { version: view.plan.version })}
        >
          {t("plan.version", { version: view.plan.version })}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {actions}
          {event.isDemo ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={t("plan.more")}
                >
                  <IconDots className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onReset}>
                  {t("plan.reset")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
      <div className="sm:pl-11">
        <PlanMetrics view={view} />
      </div>
    </header>
  );
}

import { useT } from "@agent-native/core/client/i18n";
import type { LayoutView } from "@shared/contracts/layout";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCircleCheck,
  IconDots,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { money } from "./format";

type Props = { view: LayoutView; onReset: () => void };

function Stat(props: { children: ReactNode; warn: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm tabular-nums",
        props.warn && "text-destructive",
      )}
    >
      {props.children}
    </span>
  );
}

export function PlanHeader({ view, onReset }: Props) {
  const t = useT();
  const { summary, event } = view;
  const issueCount = view.issues.length;
  return (
    <header className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border px-4 py-2.5">
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
      <Stat warn={summary.unseated > 0}>
        {t("plan.seats", {
          seats: summary.seats,
          target: summary.attendeeTarget,
        })}
        {summary.unseated > 0
          ? ` · ${t("plan.unseated", { count: summary.unseated })}`
          : ""}
      </Stat>
      <Stat warn={summary.overBudget}>
        {summary.overBudget ? <IconAlertTriangle className="size-4" /> : null}
        {t("plan.cost", {
          cost: money(summary.totalCostCents, event.currency),
          budget: money(summary.budgetCents, event.currency),
        })}
        {summary.overBudget
          ? ` · ${t("plan.overBudget", { amount: money(-summary.remainingCents, event.currency) })}`
          : ""}
        <span className="text-xs text-muted-foreground">
          {t("plan.examplePrices")}
        </span>
      </Stat>
      <Stat warn={issueCount > 0}>
        {issueCount > 0 ? (
          <IconAlertTriangle className="size-4" />
        ) : (
          <IconCircleCheck className="size-4 text-muted-foreground" />
        )}
        {issueCount > 0
          ? t("plan.issues", { count: issueCount })
          : t("plan.noIssues")}
      </Stat>
      {event.isDemo ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto size-8"
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
    </header>
  );
}

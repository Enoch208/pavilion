import { useT } from "@agent-native/core/client/i18n";
import type { LayoutView } from "@shared/contracts/view";
import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { money } from "./format";

function Metric(props: { label: string; warn: boolean; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-xs text-muted-foreground">{props.label}</dt>
      <dd
        className={cn(
          "inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm font-medium tabular-nums",
          props.warn && "text-destructive",
        )}
      >
        {props.children}
      </dd>
    </div>
  );
}

function BudgetMeter(props: { costCents: number; budgetCents: number }) {
  const share =
    props.budgetCents > 0
      ? Math.min(1, props.costCents / props.budgetCents)
      : 1;
  const over = props.costCents > props.budgetCents;
  return (
    <span
      aria-hidden
      className="inline-block h-1.5 w-16 self-center overflow-hidden rounded-full bg-muted"
    >
      <span
        className={cn(
          "block h-full rounded-full",
          over ? "bg-destructive" : "bg-foreground/60",
        )}
        style={{ width: `${share * 100}%` }}
      />
    </span>
  );
}

export function PlanMetrics({ view }: { view: LayoutView }) {
  const t = useT();
  const { summary, event } = view;
  const issueCount = view.issues.length;
  const muted = "whitespace-nowrap font-normal text-muted-foreground";
  return (
    <dl className="flex flex-wrap items-center gap-x-6 gap-y-1">
      <Metric label={t("plan.metricSeats")} warn={summary.unseated > 0}>
        {summary.seats}
        <span className={muted}>
          {t("plan.seatsOf", { target: summary.attendeeTarget })}
        </span>
        {summary.unseated > 0 ? (
          <span>{t("plan.unseated", { count: summary.unseated })}</span>
        ) : null}
      </Metric>
      <Metric label={t("plan.metricCost")} warn={summary.overBudget}>
        {summary.overBudget ? <IconAlertTriangle className="size-4" /> : null}
        {money(summary.totalCostCents, event.currency)}
        <span className={muted}>
          {t("plan.costOf", {
            budget: money(summary.budgetCents, event.currency),
          })}
        </span>
        <BudgetMeter
          costCents={summary.totalCostCents}
          budgetCents={summary.budgetCents}
        />
        {summary.overBudget ? (
          <span>
            {t("plan.overBudget", {
              amount: money(-summary.remainingCents, event.currency),
            })}
          </span>
        ) : null}
        <span className="whitespace-nowrap text-xs font-normal text-muted-foreground">
          {t("plan.examplePrices")}
        </span>
      </Metric>
      <Metric label={t("plan.metricCheck")} warn={issueCount > 0}>
        {issueCount > 0 ? (
          <IconAlertTriangle className="size-4" />
        ) : (
          <IconCircleCheck className="size-4 text-emerald-500" />
        )}
        {issueCount > 0
          ? t("plan.issues", { count: issueCount })
          : t("plan.noIssues")}
      </Metric>
    </dl>
  );
}

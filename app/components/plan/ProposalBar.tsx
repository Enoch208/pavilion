import { useT } from "@agent-native/core/client/i18n";
import type { ProposalView } from "@shared/contracts/proposal";
import type { LayoutView } from "@shared/contracts/view";
import { IconAlertTriangle, IconArrowsShuffle } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { money } from "./format";

type Props = {
  view: LayoutView;
  proposal: ProposalView;
  reviewing: boolean;
  busy: boolean;
  onReviewingChange: (reviewing: boolean) => void;
  onApply: () => void;
  onDiscard: () => void;
  onRegenerate: () => void;
};

const AUTHOR_KEY = {
  agent: "proposal.byAgent",
  human: "proposal.byHuman",
  system: "proposal.bySystem",
} as const;

function Delta(props: { amount: number; label: string }) {
  if (props.amount === 0) return null;
  return (
    <span
      className={cn(
        "rounded px-1 py-0.5 text-xs font-medium",
        props.amount > 0
          ? "bg-plan-accent/15 text-plan-accent"
          : "bg-muted text-muted-foreground",
      )}
    >
      {props.amount > 0 ? "+" : "\u2212"}
      {props.label}
    </span>
  );
}

function Swatch(props: { className: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-3 rounded-sm border-2", props.className)}
    />
  );
}

function ViewToggle(props: Pick<Props, "reviewing" | "onReviewingChange">) {
  const t = useT();
  const option = (reviewing: boolean, label: string) => (
    <button
      type="button"
      aria-pressed={props.reviewing === reviewing}
      onClick={() => props.onReviewingChange(reviewing)}
      className={cn(
        "rounded px-2 py-1 text-xs",
        props.reviewing === reviewing
          ? "bg-background font-medium shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
  return (
    <div
      role="group"
      aria-label={t("proposal.view")}
      className="inline-flex rounded-md bg-muted p-0.5"
    >
      {option(false, t("proposal.current"))}
      {option(true, t("proposal.proposed"))}
    </div>
  );
}

export function ProposalBar(props: Props) {
  const t = useT();
  const { proposal, view } = props;
  const { report } = proposal;
  const currency = view.event.currency;
  return (
    <section
      aria-label={t(AUTHOR_KEY[proposal.createdBy])}
      className="space-y-1.5 border-b border-border bg-muted/40 px-4 py-2"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="inline-flex items-center gap-2 text-sm font-medium">
          <IconArrowsShuffle className="size-4" />
          {t(AUTHOR_KEY[proposal.createdBy])}
          <span className="font-mono text-xs font-normal text-muted-foreground">
            {t("proposal.basedOn", { version: proposal.baseVersion })}
          </span>
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
          {t("proposal.seats", {
            before: report.seatsBefore,
            after: report.seatsAfter,
          })}
          <Delta
            amount={report.seatsAfter - report.seatsBefore}
            label={String(Math.abs(report.seatsAfter - report.seatsBefore))}
          />
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
          {t("proposal.cost", {
            before: money(report.costBeforeCents, currency),
            after: money(report.costAfterCents, currency),
          })}
          <Delta
            amount={report.costAfterCents - report.costBeforeCents}
            label={money(
              Math.abs(report.costAfterCents - report.costBeforeCents),
              currency,
            )}
          />
        </span>
        <span className="inline-flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Swatch className="border-plan-accent bg-plan-accent/30" />
            {t("proposal.added", { count: report.added })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Swatch className="border-dashed border-plan-accent" />
            {t("proposal.moved", { count: report.moved })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Swatch className="border-dotted border-destructive" />
            {t("proposal.removed", { count: report.removed })}
          </span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-[1_1_18rem] space-y-0.5 text-xs">
          {proposal.stale ? (
            <p className="inline-flex items-center gap-1 text-destructive">
              <IconAlertTriangle className="size-3.5" />
              {t("proposal.stale", {
                base: proposal.baseVersion,
                version: view.plan.version,
              })}
            </p>
          ) : null}
          {report.notes.map((note) => (
            <p key={note} className="text-muted-foreground">
              {note}
            </p>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ViewToggle
            reviewing={props.reviewing}
            onReviewingChange={props.onReviewingChange}
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={props.busy}
            onClick={props.onDiscard}
          >
            {t("proposal.discard")}
          </Button>
          {proposal.stale ? (
            <Button
              size="sm"
              disabled={props.busy}
              onClick={props.onRegenerate}
            >
              {t("proposal.regenerate")}
            </Button>
          ) : (
            <Button size="sm" disabled={props.busy} onClick={props.onApply}>
              {props.busy ? t("proposal.applying") : t("proposal.apply")}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

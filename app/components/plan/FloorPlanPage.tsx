import {
  actionErrorMessage,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import type { PlacedObject } from "@shared/contracts/layout";
import type { LayoutView } from "@shared/contracts/view";
import { diffLayouts } from "@shared/layout/diff";
import { useState } from "react";
import { toast } from "sonner";

import { ExportButton } from "@/components/pack/ExportButton";

import { CatalogPanel } from "./CatalogPanel";
import { HistoryPopover } from "./HistoryPopover";
import { InspectorPanel } from "./InspectorPanel";
import type { Move } from "./optimistic";
import { checkMoves } from "./plan-guards";
import { planKeyHandler } from "./plan-keys";
import { RemoveDialog, ResetDialog } from "./PlanDialogs";
import { PlanHeader } from "./PlanHeader";
import { PlanNotFound, PlanSkeleton } from "./PlanStates";
import { PlanSurface } from "./PlanSurface";
import { ProposalBar } from "./ProposalBar";
import { SuggestLayout } from "./SuggestLayout";
import { useLayoutEdits } from "./use-layout-edits";
import { usePlanRequests } from "./use-plan-requests";
import { usePlanSelection } from "./use-plan-selection";

export function FloorPlanPage({ eventId }: { eventId: string }) {
  const t = useT();
  const {
    data: view,
    isPending,
    error,
  } = useActionQuery("get-layout", { eventId });
  const edits = useLayoutEdits(eventId);
  const [selectedIds, setSelectedIds] = usePlanSelection(
    eventId,
    view?.objects,
  );
  const requests = usePlanRequests(view?.plan.id, () => setSelectedIds([]));
  const [pendingRemove, setPendingRemove] = useState<string[]>([]);
  const [resetOpen, setResetOpen] = useState(false);
  const [showCurrentFor, setShowCurrentFor] = useState<string | null>(null);

  if (isPending) return <PlanSkeleton />;
  if (!view) return <PlanNotFound message={actionErrorMessage(error)} />;
  const layout: LayoutView = view;
  const { proposal } = layout;
  const reviewing = proposal !== null && showCurrentFor !== proposal.id;
  const review = reviewing
    ? {
        objects: proposal.objects,
        diff: diffLayouts(layout.objects, proposal.objects),
      }
    : null;
  const selected = reviewing
    ? []
    : layout.objects.filter((object) => selectedIds.includes(object.id));

  function tryMove(moves: Move[]) {
    const check = checkMoves(layout, moves);
    if (check.ok) edits.moveObjects(moves);
    else if (check.reason === "locked")
      toast.error(t("plan.lockedMove", { name: check.label }));
    else toast.error(check.message);
  }

  function setLocked(objects: PlacedObject[], locked: boolean) {
    edits.setLocked(
      objects
        .filter((object) => object.locked !== locked)
        .map((object) => object.id),
      locked,
    );
  }

  const onKeyDown = planKeyHandler({
    layout,
    selected,
    clearSelection: () => setSelectedIds([]),
    move: tryMove,
    rotate: (object) =>
      edits.updateObject(object.id, {
        rotationDeg: ((object.rotationDeg + 90) %
          360) as PlacedObject["rotationDeg"],
      }),
    toggleLock: (objects) =>
      setLocked(
        objects,
        objects.some((object) => !object.locked),
      ),
    requestRemove: setPendingRemove,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PlanHeader
        view={layout}
        onReset={() => setResetOpen(true)}
        actions={
          <>
            <HistoryPopover
              view={layout}
              onRestored={() => setSelectedIds([])}
            />
            <SuggestLayout
              view={layout}
              busy={requests.proposing}
              onPropose={requests.propose}
            />
            <ExportButton
              planId={layout.plan.id}
              version={layout.plan.version}
              label="export"
              variant="ghost"
            />
          </>
        }
      />
      {proposal ? (
        <ProposalBar
          view={layout}
          proposal={proposal}
          reviewing={reviewing}
          busy={requests.deciding}
          onReviewingChange={(next) =>
            setShowCurrentFor(next ? null : proposal.id)
          }
          onApply={() => requests.apply(proposal.id)}
          onDiscard={() => requests.discard(proposal.id)}
          onRegenerate={() => requests.regenerate(proposal)}
        />
      ) : null}
      <div className="@container min-h-0 flex-1">
        <div className="grid h-full grid-cols-1 overflow-y-auto @2xl:grid-cols-[minmax(0,1fr)_16rem] @2xl:grid-rows-[minmax(0,auto)_minmax(0,1fr)] @2xl:overflow-hidden">
          <PlanSurface
            view={layout}
            review={review}
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
            onDrop={tryMove}
            onKeyDown={onKeyDown}
          />
          <aside className="border-t border-border @2xl:overflow-y-auto @2xl:border-l @2xl:border-t-0">
            {reviewing ? (
              <p className="p-3 text-sm text-muted-foreground">
                {t("proposal.reviewHint")}
              </p>
            ) : (
              <InspectorPanel
                selected={selected}
                currency={layout.event.currency}
                onMove={tryMove}
                onUpdate={edits.updateObject}
                onLock={(ids, locked) =>
                  setLocked(
                    selected.filter((object) => ids.includes(object.id)),
                    locked,
                  )
                }
                onRemove={setPendingRemove}
              />
            )}
          </aside>
          <aside className="border-t border-border @2xl:overflow-y-auto @2xl:border-l">
            <CatalogPanel
              currency={layout.event.currency}
              adding={edits.adding || reviewing}
              onAdd={(id) => edits.addItem(id, setSelectedIds)}
            />
          </aside>
        </div>
      </div>
      <RemoveDialog
        ids={pendingRemove}
        onConfirm={(ids) => {
          edits.removeObjects(ids);
          setSelectedIds([]);
        }}
        onClose={() => setPendingRemove([])}
      />
      <ResetDialog
        open={resetOpen}
        onConfirm={requests.reset}
        onClose={() => setResetOpen(false)}
      />
    </div>
  );
}

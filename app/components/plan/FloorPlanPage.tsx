import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import type { LayoutView, PlacedObject } from "@shared/contracts/layout";
import { useState, type KeyboardEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";

import { CatalogPanel } from "./CatalogPanel";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { InspectorPanel } from "./InspectorPanel";
import type { Move } from "./optimistic";
import { arrowMoves, checkMoves } from "./plan-guards";
import { RemoveDialog, ResetDialog } from "./PlanDialogs";
import { PlanHeader } from "./PlanHeader";
import { useLayoutEdits } from "./use-layout-edits";
import { usePlanSelection } from "./use-plan-selection";

const NUDGE_MM = 250;
const SHIFT_NUDGE_MM = 1_000;

function PlanSkeleton() {
  return (
    <div className="grid h-full grid-cols-1 gap-3 p-3 lg:grid-cols-[15rem_minmax(0,1fr)_17rem]">
      <Skeleton className="hidden rounded-lg lg:block" />
      <Skeleton className="min-h-[22rem] rounded-lg" />
      <Skeleton className="hidden rounded-lg lg:block" />
    </div>
  );
}

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
  const [pendingRemove, setPendingRemove] = useState<string[]>([]);
  const [resetOpen, setResetOpen] = useState(false);
  const reset = useActionMutation("reset-demo", {
    onSuccess: () => {
      setSelectedIds([]);
      toast.success(t("plan.resetDone"));
    },
    onError: (failure) =>
      toast.error(actionErrorMessage(failure) ?? t("plan.saveFailed")),
  });

  if (isPending) return <PlanSkeleton />;
  if (!view) {
    return (
      <main className="p-6 text-sm">
        <p className="text-muted-foreground">
          {actionErrorMessage(error) ?? t("plan.notFound")}
        </p>
        <Link className="mt-3 inline-block underline" to="/events">
          {t("plan.backToEvents")}
        </Link>
      </main>
    );
  }
  const layout: LayoutView = view;
  const selected = layout.objects.filter((object) =>
    selectedIds.includes(object.id),
  );

  function tryMove(moves: Move[]) {
    const check = checkMoves(layout, moves);
    if (check.ok) edits.moveObjects(moves);
    else if (check.reason === "locked")
      toast.error(t("plan.lockedMove", { name: check.label }));
    else toast.error(check.message);
  }

  function toggleLock(objects: PlacedObject[]) {
    const lock = objects.some((object) => !object.locked);
    edits.setLocked(
      objects
        .filter((object) => object.locked !== lock)
        .map((object) => object.id),
      lock,
    );
  }

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === "Escape") return setSelectedIds([]);
    if (selected.length === 0) return;
    const moves = arrowMoves(
      layout,
      selectedIds,
      event.key,
      event.shiftKey ? SHIFT_NUDGE_MM : NUDGE_MM,
    );
    if (moves) {
      event.preventDefault();
      return tryMove(moves);
    }
    const key = event.key.toLowerCase();
    const [only] = selected;
    if (key === "r" && only && selected.length === 1 && !only.locked) {
      edits.updateObject(only.id, {
        rotationDeg: ((only.rotationDeg + 90) %
          360) as PlacedObject["rotationDeg"],
      });
    } else if (key === "l") {
      toggleLock(selected);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      setPendingRemove(selected.map((object) => object.id));
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PlanHeader view={layout} onReset={() => setResetOpen(true)} />
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[15rem_minmax(0,1fr)_17rem] lg:overflow-hidden">
        <aside className="order-2 border-t border-border lg:order-1 lg:overflow-y-auto lg:border-r lg:border-t-0">
          <CatalogPanel
            currency={layout.event.currency}
            adding={edits.adding}
            onAdd={(id) => edits.addItem(id, setSelectedIds)}
          />
        </aside>
        <div className="order-1 min-h-[22rem] p-3 lg:order-2">
          <FloorPlanCanvas
            view={layout}
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
            onDrop={tryMove}
            onLockedDrag={(name) => toast.error(t("plan.lockedMove", { name }))}
            onKeyDown={onKeyDown}
          />
        </div>
        <aside className="order-3 border-t border-border lg:overflow-y-auto lg:border-l lg:border-t-0">
          <InspectorPanel
            selected={selected}
            currency={layout.event.currency}
            onMove={tryMove}
            onUpdate={edits.updateObject}
            onLock={(ids, locked) =>
              edits.setLocked(
                selected
                  .filter(
                    (object) =>
                      ids.includes(object.id) && object.locked !== locked,
                  )
                  .map((object) => object.id),
                locked,
              )
            }
            onRemove={setPendingRemove}
          />
        </aside>
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
        onConfirm={() => reset.mutate({})}
        onClose={() => setResetOpen(false)}
      />
    </div>
  );
}

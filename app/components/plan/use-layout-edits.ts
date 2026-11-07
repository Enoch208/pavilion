import {
  actionErrorMessage,
  useActionMutation,
} from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import type { LayoutView, PlacedObject } from "@shared/contracts/layout";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";

import {
  applyLock,
  applyMoves,
  applyPatch,
  applyRemoval,
  type Move,
} from "./optimistic";

type Snapshot = { previous: LayoutView | undefined };

export type ObjectPatch = Partial<
  Pick<
    PlacedObject,
    | "label"
    | "widthMm"
    | "heightMm"
    | "rotationDeg"
    | "capacity"
    | "unitCostCents"
  >
>;

export function useLayoutEdits(eventId: string) {
  const t = useT();
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["action", "get-layout", { eventId }],
    [eventId],
  );
  const current = () => queryClient.getQueryData<LayoutView>(queryKey);

  function optimistic<TInput>(
    apply: (view: LayoutView, input: TInput) => LayoutView,
  ) {
    return {
      onMutate: async (input: TInput): Promise<Snapshot> => {
        await queryClient.cancelQueries({ queryKey });
        const previous = current();
        if (previous)
          queryClient.setQueryData(queryKey, apply(previous, input));
        return { previous };
      },
      onError: (error: Error, _input: TInput, context: unknown) => {
        const snapshot = context as Snapshot | undefined;
        if (snapshot?.previous) {
          queryClient.setQueryData(queryKey, snapshot.previous);
        }
        toast.error(actionErrorMessage(error) ?? t("plan.saveFailed"));
      },
    };
  }

  const move = useActionMutation(
    "move-objects",
    optimistic((view, input: { moves: Move[] }) =>
      applyMoves(view, input.moves),
    ),
  );
  const update = useActionMutation(
    "update-object",
    optimistic((view, input: { objectId: string; patch: ObjectPatch }) =>
      applyPatch(view, input.objectId, input.patch),
    ),
  );
  const lock = useActionMutation(
    "lock-objects",
    optimistic((view, input: { objectIds: string[]; locked: boolean }) =>
      applyLock(view, input.objectIds, input.locked),
    ),
  );
  const remove = useActionMutation(
    "remove-objects",
    optimistic((view, input: { objectIds: string[] }) =>
      applyRemoval(view, input.objectIds),
    ),
  );
  const add = useActionMutation("add-objects", {
    onError: (error) =>
      toast.error(actionErrorMessage(error) ?? t("plan.saveFailed")),
  });

  function planRef() {
    const view = current();
    return view
      ? { planId: view.plan.id, expectedVersion: view.plan.version }
      : null;
  }

  return {
    adding: add.isPending,
    moveObjects(moves: Move[]) {
      const ref = planRef();
      if (ref && moves.length > 0) move.mutate({ ...ref, moves });
    },
    updateObject(objectId: string, patch: ObjectPatch) {
      const ref = planRef();
      if (ref) update.mutate({ ...ref, objectId, patch });
    },
    setLocked(objectIds: string[], locked: boolean) {
      const ref = planRef();
      if (ref && objectIds.length > 0)
        lock.mutate({ ...ref, objectIds, locked });
    },
    removeObjects(objectIds: string[]) {
      const ref = planRef();
      if (ref && objectIds.length > 0) remove.mutate({ ...ref, objectIds });
    },
    addItem(catalogItemId: string, onAdded: (ids: string[]) => void) {
      const ref = planRef();
      if (!ref) return;
      add.mutate(
        { ...ref, objects: [{ catalogItemId }] },
        {
          onSuccess: (result) =>
            onAdded(result.objects.map((object) => object.id)),
        },
      );
    },
  };
}

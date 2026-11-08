import {
  actionErrorMessage,
  useActionMutation,
} from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import type { ProposalView } from "@shared/contracts/proposal";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function usePlanRequests(
  planId: string | undefined,
  onLayoutReplaced: () => void,
) {
  const t = useT();
  const queryClient = useQueryClient();
  const fail = (fallback: string) => (error: Error) => {
    toast.error(actionErrorMessage(error) ?? fallback);
    void queryClient.invalidateQueries({ queryKey: ["action", "get-layout"] });
  };
  const propose = useActionMutation("propose-layout", {
    onError: fail(t("proposal.failed")),
  });
  const apply = useActionMutation("apply-proposal", {
    uiOnly: true,
    onSuccess: (result) => {
      onLayoutReplaced();
      toast.success(t("proposal.applied", { version: result.version }));
    },
    onError: fail(t("plan.saveFailed")),
  });
  const discard = useActionMutation("discard-proposal", {
    onSuccess: () => toast.success(t("proposal.discarded")),
    onError: fail(t("plan.saveFailed")),
  });
  const reset = useActionMutation("reset-demo", {
    onSuccess: () => {
      onLayoutReplaced();
      toast.success(t("plan.resetDone"));
    },
    onError: fail(t("plan.saveFailed")),
  });

  return {
    proposing: propose.isPending,
    deciding: apply.isPending || discard.isPending || propose.isPending,
    propose(input: {
      mode: "theatre" | "banquet";
      attendeeTarget: number;
      minAisleMm: number;
    }) {
      if (planId) propose.mutate({ planId, ...input });
    },
    regenerate(proposal: ProposalView) {
      if (!planId) return;
      propose.mutate({
        planId,
        mode: proposal.mode,
        attendeeTarget: proposal.attendeeTarget,
        minAisleMm: proposal.minAisleMm,
      });
    },
    apply: (proposalId: string) => apply.mutate({ proposalId }),
    discard: (proposalId: string) => discard.mutate({ proposalId }),
    reset: () => reset.mutate({}),
  };
}

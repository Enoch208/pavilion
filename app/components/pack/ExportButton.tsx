import {
  actionErrorMessage,
  useActionMutation,
} from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import { IconFileExport } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Props = {
  planId: string;
  version: number;
  label: "export" | "exportAgain";
  variant: "ghost" | "outline";
};

export function ExportButton({ planId, version, label, variant }: Props) {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const exportPack = useActionMutation("export-setup-pack", {
    onSuccess: (result) => navigate(result.path),
    onError: (error) => {
      toast.error(actionErrorMessage(error) ?? t("pack.exportFailed"));
      void queryClient.invalidateQueries({
        queryKey: ["action", "get-layout"],
      });
    },
  });
  return (
    <Button
      variant={variant}
      size="sm"
      disabled={exportPack.isPending}
      onClick={() => exportPack.mutate({ planId, expectedVersion: version })}
    >
      <IconFileExport className="size-4" />
      {exportPack.isPending
        ? t("pack.exporting")
        : label === "exportAgain"
          ? t("pack.exportAgain")
          : t("pack.export")}
    </Button>
  );
}

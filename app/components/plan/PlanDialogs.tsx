import { useT } from "@agent-native/core/client/i18n";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ConfirmDialog(props: {
  open: boolean;
  title: string;
  description: string;
  confirm: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <AlertDialog
      open={props.open}
      onOpenChange={(open) => !open && props.onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{props.title}</AlertDialogTitle>
          <AlertDialogDescription>{props.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("plan.keep")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              props.onConfirm();
              props.onClose();
            }}
          >
            {props.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RemoveDialog(props: {
  ids: string[];
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <ConfirmDialog
      open={props.ids.length > 0}
      title={t("plan.removeTitle", { count: props.ids.length })}
      description={t("plan.removeDescription")}
      confirm={t("plan.remove")}
      onConfirm={() => props.onConfirm(props.ids)}
      onClose={props.onClose}
    />
  );
}

export function ResetDialog(props: {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <ConfirmDialog
      open={props.open}
      title={t("plan.resetTitle")}
      description={t("plan.resetDescription")}
      confirm={t("plan.reset")}
      onConfirm={props.onConfirm}
      onClose={props.onClose}
    />
  );
}

import { useT } from "@agent-native/core/client/i18n";
import type { PlacedObject } from "@shared/contracts/layout";
import {
  IconLock,
  IconLockOpen,
  IconRotateClockwise,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

import { metres, money, seatsLabel } from "./format";
import { MetreField, TextField } from "./InspectorFields";
import type { Move } from "./optimistic";
import type { ObjectPatch } from "./use-layout-edits";

type Props = {
  selected: PlacedObject[];
  currency: string;
  onMove: (moves: Move[]) => void;
  onUpdate: (objectId: string, patch: ObjectPatch) => void;
  onLock: (ids: string[], locked: boolean) => void;
  onRemove: (ids: string[]) => void;
};

function SelectionActions(props: Props) {
  const t = useT();
  const ids = props.selected.map((object) => object.id);
  const anyUnlocked = props.selected.some((object) => !object.locked);
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => props.onLock(ids, anyUnlocked)}
      >
        {anyUnlocked ? (
          <IconLock className="size-4" />
        ) : (
          <IconLockOpen className="size-4" />
        )}
        {anyUnlocked ? t("plan.lock") : t("plan.unlock")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!anyUnlocked}
        onClick={() => props.onRemove(ids)}
      >
        <IconTrash className="size-4" />
        {t("plan.remove")}
      </Button>
    </div>
  );
}

function SingleObject(props: Props & { object: PlacedObject }) {
  const t = useT();
  const { object } = props;
  const position = (axis: "xMm" | "yMm", value: number) =>
    props.onMove([
      { objectId: object.id, xMm: object.xMm, yMm: object.yMm, [axis]: value },
    ]);
  return (
    <div className="space-y-3">
      <TextField
        id="object-label"
        label={t("plan.name")}
        value={object.label}
        onCommit={(label) => props.onUpdate(object.id, { label })}
      />
      <p className="text-xs tabular-nums text-muted-foreground">
        {object.capacity > 0 ? `${seatsLabel(object.capacity, t)} · ` : ""}
        {object.unitCostCents > 0
          ? money(object.unitCostCents, props.currency)
          : t("plan.noCost")}
        {object.locked ? ` · ${t("plan.locked")}` : ""}
      </p>
      <div className="grid grid-cols-2 items-end gap-2">
        <MetreField
          id="object-x"
          label={t("plan.fromWest")}
          mm={object.xMm}
          disabled={object.locked}
          onCommit={(mm) => position("xMm", mm)}
        />
        <MetreField
          id="object-y"
          label={t("plan.fromNorth")}
          mm={object.yMm}
          disabled={object.locked}
          onCommit={(mm) => position("yMm", mm)}
        />
        <MetreField
          id="object-width"
          label={t("plan.width")}
          mm={object.widthMm}
          disabled={object.locked}
          onCommit={(widthMm) => props.onUpdate(object.id, { widthMm })}
        />
        <MetreField
          id="object-depth"
          label={t("plan.depth")}
          mm={object.heightMm}
          disabled={object.locked}
          onCommit={(heightMm) => props.onUpdate(object.id, { heightMm })}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={object.locked}
        onClick={() =>
          props.onUpdate(object.id, {
            rotationDeg: ((object.rotationDeg + 90) %
              360) as PlacedObject["rotationDeg"],
          })
        }
      >
        <IconRotateClockwise className="size-4" />
        {t("plan.rotate")}
        <span className="text-muted-foreground tabular-nums">
          {object.rotationDeg}°
        </span>
      </Button>
    </div>
  );
}

export function InspectorPanel(props: Props) {
  const t = useT();
  const [single] = props.selected;
  if (!single) {
    return (
      <div className="space-y-2 p-3 text-sm text-muted-foreground">
        <p>{t("plan.nothingSelected")}</p>
        <p id="floor-plan-keys" className="text-xs">
          {t("plan.keyboardHint")}
        </p>
      </div>
    );
  }
  return (
    <section className="space-y-4 p-3" aria-live="polite">
      {props.selected.length === 1 ? (
        <SingleObject {...props} object={single} />
      ) : (
        <p className="text-sm font-medium">
          {t("plan.selectedCount", { count: props.selected.length })}
          <span className="block text-xs font-normal tabular-nums text-muted-foreground">
            {metres(Math.min(...props.selected.map((object) => object.xMm)))} m,{" "}
            {metres(Math.min(...props.selected.map((object) => object.yMm)))} m
          </span>
        </p>
      )}
      <SelectionActions {...props} />
      <p id="floor-plan-keys" className="text-xs text-muted-foreground">
        {t("plan.keyboardHint")}
      </p>
    </section>
  );
}

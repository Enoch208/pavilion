import { useActionQuery } from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import type { CatalogItem } from "@shared/catalog";
import { IconPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { metres, money, seatsLabel } from "./format";

type Props = {
  currency: string;
  adding: boolean;
  onAdd: (catalogItemId: string) => void;
};

function CatalogRow(props: {
  item: CatalogItem;
  currency: string;
  disabled: boolean;
  onAdd: (id: string) => void;
}) {
  const t = useT();
  const { item } = props;
  return (
    <li className="flex items-center gap-2 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{item.name}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {metres(item.widthMm)} × {metres(item.heightMm)} m
          {item.capacity > 0 ? ` · ${seatsLabel(item.capacity, t)}` : ""}
          {" · "}
          {item.unitCostCents > 0
            ? money(item.unitCostCents, props.currency)
            : t("plan.noCost")}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        aria-label={t("plan.addItem", { name: item.name })}
        disabled={props.disabled}
        onClick={() => props.onAdd(item.id)}
      >
        <IconPlus className="size-4" />
      </Button>
    </li>
  );
}

export function CatalogPanel(props: Props) {
  const t = useT();
  const { data, isPending } = useActionQuery("get-catalog", {});
  if (isPending || !data) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-9 rounded-md" />
        ))}
      </div>
    );
  }
  const groups = [
    { key: "equipment", title: t("plan.equipment") },
    { key: "fixed", title: t("plan.fixed") },
  ] as const;
  return (
    <section aria-label={t("plan.catalog")} className="space-y-4 p-3">
      {groups.map((group) => (
        <div key={group.key}>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {group.title}
          </h2>
          <ul className="mt-1 divide-y divide-border">
            {data.items
              .filter((item) => item.group === group.key)
              .map((item) => (
                <CatalogRow
                  key={item.id}
                  item={item}
                  currency={props.currency}
                  disabled={props.adding}
                  onAdd={props.onAdd}
                />
              ))}
          </ul>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">{t("plan.pricesNote")}</p>
    </section>
  );
}

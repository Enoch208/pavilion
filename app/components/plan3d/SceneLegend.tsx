import { useT } from "@agent-native/core/client/i18n";

import type { ScenePalette } from "./scene-palette";

function Swatch({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        aria-hidden
        className="inline-block size-2.5 rounded-sm"
        style={{ backgroundColor: colour }}
      />
      {label}
    </span>
  );
}

type Props = { palette: ScenePalette; reviewing: boolean };

export function SceneLegend({ palette, reviewing }: Props) {
  const t = useT();
  return (
    <div className="space-y-1 rounded-md bg-background/85 px-2 py-1.5 text-xs text-muted-foreground shadow-sm">
      {reviewing ? (
        <p className="flex flex-wrap gap-x-3 gap-y-1">
          <Swatch colour={palette.accent} label={t("plan3d.added")} />
          <Swatch colour={palette.moved} label={t("plan3d.moved")} />
          <Swatch colour={palette.removed} label={t("plan3d.removed")} />
        </p>
      ) : null}
      <p>{t("plan3d.heightsNote")}</p>
    </div>
  );
}

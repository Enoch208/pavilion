import { useT } from "@agent-native/core/client/i18n";
import { Canvas } from "@react-three/fiber";
import type { PlacedObject } from "@shared/contracts/layout";
import type { LayoutView } from "@shared/contracts/view";
import { IconFocusCentered } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useCallback, useMemo, useState } from "react";

import type { Review } from "@/components/plan/FloorPlanCanvas";
import { metres } from "@/components/plan/format";
import { Button } from "@/components/ui/button";

import { homeView } from "./OrbitRig";
import { DARK_PALETTE, LIGHT_PALETTE } from "./scene-palette";
import { SceneContents } from "./SceneContents";
import { SceneLegend } from "./SceneLegend";

type Props = {
  view: LayoutView;
  review: Review | null;
  selectedIds: readonly string[];
  onSelect: (ids: string[]) => void;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function toggled(ids: readonly string[], id: string) {
  return ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id];
}

export default function PlanScene(props: Props) {
  const t = useT();
  const { resolvedTheme } = useTheme();
  const palette = resolvedTheme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
  const [hovered, setHovered] = useState<PlacedObject | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [animate] = useState(() => !prefersReducedMotion());
  const { venue } = props.view;
  const widthM = venue.widthMm / 1_000;
  const depthM = venue.heightMm / 1_000;
  const selectedIds = useMemo(
    () => new Set(props.selectedIds),
    [props.selectedIds],
  );
  const { onSelect, selectedIds: currentIds, review } = props;
  const onClick = useCallback(
    (object: PlacedObject, additive: boolean) =>
      onSelect(additive ? toggled(currentIds, object.id) : [object.id]),
    [onSelect, currentIds],
  );

  return (
    <div
      role="group"
      aria-label={t("plan3d.label", {
        venue: venue.name,
        width: metres(venue.widthMm),
        depth: metres(venue.heightMm),
      })}
      className="relative size-full overflow-hidden rounded-lg"
      onPointerLeave={() => setHovered(null)}
    >
      <Canvas
        frameloop="demand"
        shadows
        dpr={[1, 2]}
        camera={{
          fov: 40,
          near: 0.1,
          far: 500,
          position: [...homeView(widthM, depthM).position],
        }}
        fallback={
          <p className="p-4 text-sm text-muted-foreground">
            {t("plan3d.unsupported")}
          </p>
        }
        onPointerMissed={() => {
          if (!review) onSelect([]);
        }}
        className={hovered && !review ? "cursor-pointer" : "cursor-grab"}
      >
        <SceneContents
          view={props.view}
          review={review}
          selectedIds={selectedIds}
          palette={palette}
          resetKey={resetKey}
          animate={animate}
          onClick={review ? null : onClick}
          onHover={setHovered}
        />
      </Canvas>
      {hovered ? (
        <p className="pointer-events-none absolute left-3 top-3 rounded-md bg-background/90 px-2 py-1 text-xs shadow-sm">
          {hovered.label}
          {hovered.locked ? ` · ${t("plan.locked")}` : ""}
        </p>
      ) : null}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
        <SceneLegend palette={palette} reviewing={review !== null} />
        <Button
          variant="secondary"
          size="sm"
          className="pointer-events-auto"
          onClick={() => setResetKey((key) => key + 1)}
        >
          <IconFocusCentered className="size-4" />
          {t("plan3d.resetView")}
        </Button>
      </div>
    </div>
  );
}

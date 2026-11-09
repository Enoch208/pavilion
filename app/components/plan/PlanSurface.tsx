import { useT } from "@agent-native/core/client/i18n";
import type { LayoutView } from "@shared/contracts/view";
import { IconCube, IconLayoutGrid } from "@tabler/icons-react";
import {
  lazy,
  Suspense,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { FloorPlanCanvas, type Review } from "./FloorPlanCanvas";
import type { Move } from "./optimistic";

const PlanScene = lazy(() => import("@/components/plan3d/PlanScene"));

type Mode = "plan" | "3d";

function modeKey(eventId: string) {
  return `pavilion:plan-mode:${eventId}`;
}

function readMode(eventId: string): Mode {
  try {
    return window.sessionStorage.getItem(modeKey(eventId)) === "3d"
      ? "3d"
      : "plan";
  } catch {
    return "plan"; // coercion-ok: blocked storage only forgets the view choice; the plan view is the safe start
  }
}

function useStoredMode(eventId: string) {
  const [mode, setMode] = useState<Mode>(() => readMode(eventId));
  function change(next: Mode) {
    setMode(next);
    try {
      window.sessionStorage.setItem(modeKey(eventId), next);
    } catch {
      return; // coercion-ok: blocked storage only forgets the view choice for the next visit
    }
  }
  return [mode, change] as const;
}

type Props = {
  view: LayoutView;
  review: Review | null;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onDrop: (moves: Move[]) => void;
  onKeyDown: (event: KeyboardEvent<SVGSVGElement>) => void;
};

function ModeToggle(props: { mode: Mode; onChange: (mode: Mode) => void }) {
  const t = useT();
  const option = (mode: Mode, label: string, icon: ReactNode) => (
    <button
      type="button"
      aria-pressed={props.mode === mode}
      onClick={() => props.onChange(mode)}
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-1 text-xs",
        props.mode === mode
          ? "bg-background font-medium shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
  return (
    <div
      role="group"
      aria-label={t("plan3d.viewToggle")}
      className="absolute right-5 top-5 inline-flex rounded-md bg-muted p-0.5 shadow-sm"
    >
      {option(
        "plan",
        t("plan3d.plan"),
        <IconLayoutGrid className="size-3.5" />,
      )}
      {option("3d", t("plan3d.threeD"), <IconCube className="size-3.5" />)}
    </div>
  );
}

export function PlanSurface(props: Props) {
  const t = useT();
  const [mode, setMode] = useStoredMode(props.view.event.id);
  return (
    <div className="relative min-h-[22rem] p-3 @2xl:row-span-2">
      {mode === "3d" ? (
        <Suspense fallback={<Skeleton className="size-full rounded-lg" />}>
          <PlanScene
            view={props.view}
            review={props.review}
            selectedIds={props.selectedIds}
            onSelect={props.onSelect}
          />
        </Suspense>
      ) : (
        <FloorPlanCanvas
          view={props.view}
          review={props.review}
          selectedIds={props.selectedIds}
          onSelect={props.onSelect}
          onDrop={props.onDrop}
          onLockedDrag={(name) => toast.error(t("plan.lockedMove", { name }))}
          onKeyDown={props.onKeyDown}
        />
      )}
      <ModeToggle mode={mode} onChange={setMode} />
    </div>
  );
}

import { useSession } from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { EVENTS_PATH } from "@/hooks/use-navigation-state";
import { cn } from "@/lib/utils";

import { useStartDemo } from "./use-start-demo";

export const DISPLAY = "font-medium text-balance text-[#202020]";

const PILL =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#202020] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa] disabled:opacity-60";

export const PILL_PRIMARY = cn(
  PILL,
  "bg-[#202020] text-white hover:bg-[#3a3a3a]",
);
export const PILL_SECONDARY = cn(
  PILL,
  "bg-[#eeeeee] text-[#202020] hover:bg-[#e2e2e2]",
);

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#6b6b6b]">
      {children}
    </p>
  );
}

export function DemoButton({ note }: { note: boolean }) {
  const t = useT();
  const { session, status } = useSession();
  const demo = useStartDemo();
  if (session) {
    return (
      <Link to={EVENTS_PATH} className={PILL_PRIMARY}>
        {t("landing.open")}
      </Link>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={demo.start}
        disabled={demo.pending || status === "loading"}
        className={PILL_PRIMARY}
      >
        {demo.pending ? t("landing.starting") : t("landing.tryDemo")}
      </button>
      {demo.failed ? (
        <p role="alert" className="mt-4 text-sm text-[#b42318]">
          {demo.failed.message ?? t("landing.startFailed")}
        </p>
      ) : note ? (
        <p className="mt-4 max-w-sm text-center text-xs leading-5 text-[#8a8a8a]">
          {t("landing.demoNote")}
        </p>
      ) : null}
    </div>
  );
}

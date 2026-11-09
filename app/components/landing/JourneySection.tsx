import { useT } from "@agent-native/core/client/i18n";
import type { SetupPack } from "@shared/export/pack";
import { useState } from "react";

import { money } from "@/components/plan/format";
import { cn } from "@/lib/utils";

import { DISPLAY } from "./landing-ui";

const STEPS = ["edit", "ask", "compare", "apply", "export"] as const;
type Step = (typeof STEPS)[number];

const STEP_KEYS = {
  edit: ["landing.stepEditTitle", "landing.stepEditBody"],
  ask: ["landing.stepAskTitle", "landing.stepAskBody"],
  compare: ["landing.stepCompareTitle", "landing.stepCompareBody"],
  apply: ["landing.stepApplyTitle", "landing.stepApplyBody"],
  export: ["landing.stepExportTitle", "landing.stepExportBody"],
} as const;

const CARD =
  "rounded-xl bg-white p-5 text-sm shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]";

function StepCard({ step, pack }: { step: Step; pack: SetupPack }) {
  const t = useT();
  const currency = pack.source.event.currency;
  if (step === "edit") {
    return (
      <div className={CARD}>
        <p className="font-medium text-[#b42318]">{t("landing.demoRefused")}</p>
        <p className="mt-1 text-[#6b6b6b]">{t("landing.demoRefusedBody")}</p>
      </div>
    );
  }
  if (step === "ask") {
    return (
      <div className={cn(CARD, "space-y-3")}>
        <p className="ml-auto w-fit rounded-2xl bg-[#f0f0f0] px-3 py-2">
          {t("landing.demoPrompt")}
        </p>
        <p className="leading-6 text-[#3a3a3a]">{t("landing.demoReply")}</p>
      </div>
    );
  }
  if (step === "compare") {
    return (
      <div className={cn(CARD, "space-y-2 tabular-nums")}>
        <p>
          {t("landing.cardSeats")} 120 → 140{" "}
          <span className="rounded bg-[#e0efff] px-1 text-xs text-[#0b62c4]">
            +20
          </span>
        </p>
        <p>
          {t("landing.cardCost")} US$3,040 → US$3,130{" "}
          <span className="rounded bg-[#e0efff] px-1 text-xs text-[#0b62c4]">
            +US$90
          </span>
        </p>
        <p className="text-xs text-[#6b6b6b]">{t("landing.demoDiff")}</p>
      </div>
    );
  }
  if (step === "apply") {
    return (
      <div className={CARD}>
        <p className="font-medium">{t("landing.demoApplied")}</p>
        <p className="mt-1 text-[#6b6b6b]">{t("landing.demoAppliedBody")}</p>
      </div>
    );
  }
  const items = pack.items.filter((item) => item.lineCostCents > 0);
  return (
    <div className={CARD}>
      <ul className="space-y-1.5 tabular-nums">
        {items.map((item) => (
          <li key={item.name} className="flex justify-between gap-6">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="text-[#6b6b6b]">
              {money(item.lineCostCents, currency)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex justify-between gap-6 border-t border-[#ececec] pt-3 font-medium tabular-nums">
        <span>{t("landing.demoTotal")}</span>
        <span>{money(pack.summary.totalCostCents, currency)}</span>
      </p>
    </div>
  );
}

export function JourneySection(props: { preview: string; pack: SetupPack }) {
  const t = useT();
  const [active, setActive] = useState<Step>("edit");
  return (
    <section id="how" className="scroll-mt-8 px-6 py-24 lg:px-[120px] lg:py-32">
      <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-center">
        <div>
          <h2
            className={cn(
              DISPLAY,
              "text-[clamp(2.75rem,5.4vw,4.875rem)] leading-[1.04] tracking-[-0.058em]",
            )}
          >
            {t("landing.journeyTitle")}
          </h2>
          <ul className="mt-10 space-y-3">
            {STEPS.map((step) => {
              const [title, body] = STEP_KEYS[step];
              const on = step === active;
              return (
                <li key={step}>
                  <button
                    type="button"
                    aria-expanded={on}
                    onClick={() => setActive(step)}
                    className={cn(
                      "text-xl leading-[1.43] transition-colors",
                      on
                        ? "text-[#202020]"
                        : "text-[#9a9a9a] hover:text-[#202020]",
                    )}
                  >
                    {t(title)}
                  </button>
                  {on ? (
                    <p className="mt-1 max-w-[20rem] text-sm leading-[1.8] text-[#6b6b6b]">
                      {t(body)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="relative rounded-[28px] bg-[#f0f0f0] p-6 sm:p-10">
          <img
            src={props.preview}
            alt=""
            width={1200}
            height={847}
            className="block h-auto w-full rounded-[2px] bg-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.3)]"
          />
          <div className="mt-6 sm:absolute sm:bottom-8 sm:right-8 sm:mt-0 sm:w-[300px]">
            <StepCard step={active} pack={props.pack} />
          </div>
        </div>
      </div>
    </section>
  );
}

import { useT } from "@agent-native/core/client/i18n";

import { cn } from "@/lib/utils";

import { DISPLAY, Eyebrow } from "./landing-ui";

const RULES = [
  ["landing.ruleCheckTitle", "landing.ruleCheckBody"],
  ["landing.ruleProposeTitle", "landing.ruleProposeBody"],
  ["landing.ruleStaleTitle", "landing.ruleStaleBody"],
] as const;

const FEATURES = [
  ["landing.featureScreenTitle", "landing.featureScreenBody", "view-screen"],
  ["landing.feature3dTitle", "landing.feature3dBody", "get-layout"],
  ["landing.featurePackTitle", "landing.featurePackBody", "export-setup-pack"],
] as const;

export function RulesSection() {
  const t = useT();
  return (
    <section
      id="rules"
      className="scroll-mt-8 bg-[#0b0b0b] px-6 py-24 text-[#fafafa] lg:px-[120px] lg:py-32"
    >
      <div className="mx-auto max-w-[1200px]">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a8a8a]">
          {t("landing.rulesEyebrow")}
        </p>
        <h2 className="mt-6 text-balance text-[clamp(2.5rem,4.45vw,4rem)] font-medium leading-[1.04] tracking-[-0.055em]">
          {t("landing.rulesTitle")}
        </h2>
        <ul className="mt-16 grid gap-10 md:grid-cols-3">
          {RULES.map(([title, body]) => (
            <li key={title} className="border-t border-[#2a2a2a] pt-6">
              <h3 className="text-xl tracking-[-0.02em]">{t(title)}</h3>
              <p className="mt-3 text-[15px] leading-[1.65] text-[#a3a3a3]">
                {t(body)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SharedPath() {
  const t = useT();
  const callers = [t("landing.pathCanvas"), t("landing.pathAgent")];
  return (
    <div aria-hidden className="rounded-[28px] bg-[#f0f0f0] p-6 text-sm sm:p-8">
      <div className="grid grid-cols-2 gap-3">
        {callers.map((caller) => (
          <p
            key={caller}
            className="rounded-xl bg-white px-4 py-3 text-[#3a3a3a] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.35)]"
          >
            {caller}
          </p>
        ))}
      </div>
      <div className="mx-auto h-8 w-px bg-[#c9c9c9]" />
      <p className="mx-auto w-fit rounded-lg bg-[#1c1c1c] px-3 py-2 font-mono text-xs text-[#e5e5e5]">
        move-objects
      </p>
      <div className="mx-auto h-8 w-px bg-[#c9c9c9]" />
      <p className="mx-auto w-fit rounded-xl bg-white px-4 py-3 text-[#3a3a3a] shadow-[0_12px_30px_-20px_rgba(0,0,0,0.35)]">
        {t("landing.pathEngine")}
      </p>
    </div>
  );
}

export function AgentNativeSection() {
  const t = useT();
  return (
    <section
      id="agent"
      className="scroll-mt-8 px-6 py-24 lg:px-[120px] lg:py-28"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center">
          <div>
            <Eyebrow>{t("landing.agentEyebrow")}</Eyebrow>
            <h2
              className={cn(
                DISPLAY,
                "mt-6 text-[clamp(2.5rem,4.45vw,4rem)] leading-[1.04] tracking-[-0.055em]",
              )}
            >
              {t("landing.agentTitle")}
            </h2>
            <p className="mt-8 max-w-[26rem] text-xl leading-[1.625] tracking-[-0.015em] text-[#6b6b6b]">
              {t("landing.agentBody")}
            </p>
          </div>
          <SharedPath />
        </div>
        <p className="mt-20 text-xl tracking-[-0.025em] text-[#666666]">
          {t("landing.featuresLead")}
        </p>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {FEATURES.map(([title, body, action]) => (
            <li
              key={title}
              className="flex flex-col rounded-[28px] bg-[#f0f0f0] p-8 lg:p-9"
            >
              <h3 className="text-2xl font-medium tracking-[-0.03em] text-[#202020]">
                {t(title)}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.65] text-[#666666]">
                {t(body)}
              </p>
              <p className="mt-8 w-fit rounded-lg bg-[#1c1c1c] px-3 py-2 font-mono text-xs text-[#e5e5e5]">
                {action}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

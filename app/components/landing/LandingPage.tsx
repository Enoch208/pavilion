import { appPath } from "@agent-native/core/client/api-path";
import { useT } from "@agent-native/core/client/i18n";
import { IconLayoutBoard } from "@tabler/icons-react";
import { useMemo } from "react";

import { APP_TITLE } from "@/lib/app-config";
import { cn } from "@/lib/utils";

import { HeroCanvas } from "./HeroCanvas";
import { JourneySection } from "./JourneySection";
import { DemoButton, DISPLAY, PILL_SECONDARY } from "./landing-ui";
import { novaPack, novaPreviewUrl } from "./nova-preview";
import { AgentNativeSection, RulesSection } from "./ProofSections";

const NAV = [
  ["#how", "landing.navHow"],
  ["#rules", "landing.navRules"],
  ["#agent", "landing.navAgent"],
] as const;

function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2 text-[15px] font-medium tracking-[-0.02em] text-[#202020]">
      <IconLayoutBoard className="size-5" stroke={1.75} />
      {APP_TITLE}
    </span>
  );
}

function Header() {
  const t = useT();
  return (
    <header className="absolute inset-x-0 top-0 z-10 flex h-[100px] items-center justify-between px-6 lg:px-24">
      <Wordmark />
      <nav className="hidden items-center md:flex">
        {NAV.map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-full px-4 py-2 text-sm text-[#202020] transition-colors hover:bg-black/5"
          >
            {t(label)}
          </a>
        ))}
      </nav>
      <a
        href={appPath("/sign-in")}
        className="rounded-full px-4 py-2 text-sm text-[#202020] transition-colors hover:bg-black/5"
      >
        {t("landing.signIn")}
      </a>
    </header>
  );
}

function Footer() {
  const t = useT();
  const limits = [
    t("landing.limitPrices"),
    t("landing.limitCapacity"),
    t("landing.limitCheck"),
  ];
  return (
    <footer className="border-t border-[#ececec] px-6 py-16 lg:px-[120px]">
      <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-[1fr_auto_auto] md:gap-24">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-xs text-sm leading-6 text-[#6b6b6b]">
            {t("landing.footerBuilt")}
          </p>
        </div>
        <div>
          <p className="pt-1 font-semibold text-[#202020]">
            {t("landing.footerProduct")}
          </p>
          <ul className="mt-4 space-y-3 text-sm text-[#6b6b6b]">
            {NAV.map(([href, label]) => (
              <li key={href}>
                <a href={href} className="hover:text-[#202020]">
                  {t(label)}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="pt-1 font-semibold text-[#202020]">
            {t("landing.footerLimits")}
          </p>
          <ul className="mt-4 max-w-[16rem] space-y-3 text-sm leading-5 text-[#6b6b6b]">
            {limits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  const t = useT();
  const pack = useMemo(novaPack, []);
  const preview = useMemo(() => novaPreviewUrl(pack), [pack]);
  return (
    <div className="min-h-dvh bg-[#fafafa] font-sans text-[#202020] antialiased">
      <Header />
      <main>
        <section className="flex flex-col items-center px-6 pb-16 pt-[140px] text-center lg:pb-[72px] lg:pt-[164px]">
          <h1
            className={cn(
              DISPLAY,
              "text-[clamp(3.25rem,7.9vw,7.11rem)] leading-[1.015] tracking-[-0.067em]",
            )}
          >
            <span className="block">{t("landing.titleLine1")}</span>
            <span className="block">{t("landing.titleLine2")}</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-[1.6] tracking-[-0.025em] text-[#6b6b6b]">
            {t("landing.pitch")}
          </p>
          <div className="mt-8">
            <DemoButton note />
          </div>
        </section>
        <HeroCanvas preview={preview} />
        <JourneySection preview={preview} pack={pack} />
        <RulesSection />
        <AgentNativeSection />
        <section className="flex flex-col items-center px-6 py-24 text-center lg:py-32">
          <h2
            className={cn(
              DISPLAY,
              "text-[clamp(3rem,6.95vw,6.25rem)] leading-[1.06] tracking-[-0.065em]",
            )}
          >
            {t("landing.closingTitle")}
          </h2>
          <div className="mt-10 flex flex-wrap items-start justify-center gap-3">
            <DemoButton note={false} />
            <a href={appPath("/sign-in")} className={PILL_SECONDARY}>
              {t("landing.signIn")}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

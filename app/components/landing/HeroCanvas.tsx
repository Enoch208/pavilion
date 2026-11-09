import { useT } from "@agent-native/core/client/i18n";
import { IconCheck } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

function ProposalCard({ className }: { className?: string }) {
  const t = useT();
  return (
    <aside
      className={cn(
        "w-full max-w-[236px] rounded-sm bg-[#dfe6c9] p-5 text-[#2c3a1c] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.14em]">
        {t("landing.cardProposalEyebrow")}
      </p>
      <p className="mt-6 text-[64px] font-medium leading-[0.9] tracking-[-0.06em]">
        +20
      </p>
      <p className="mt-1 text-lg font-medium tracking-[-0.02em]">
        {t("landing.cardProposalSeats")}
      </p>
      <dl className="mt-6 space-y-1 text-xs leading-5">
        <div className="flex justify-between gap-3">
          <dt>{t("landing.cardSeats")}</dt>
          <dd className="tabular-nums">120 → 140</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{t("landing.cardCost")}</dt>
          <dd className="tabular-nums">US$3,040 → US$3,130</dd>
        </div>
      </dl>
      <p className="mt-6 text-xs leading-5 opacity-80">
        {t("landing.cardProposalNote")}
      </p>
    </aside>
  );
}

function CheckCard({ className }: { className?: string }) {
  const t = useT();
  const checks = [
    t("landing.checkWalls"),
    t("landing.checkOverlap"),
    t("landing.checkExits"),
    t("landing.checkLocked"),
  ];
  return (
    <aside
      className={cn(
        "w-full max-w-[220px] rounded-xl bg-white p-4 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <p className="text-xs font-medium text-[#202020]">
        {t("landing.cardCheckTitle")}
      </p>
      <ul className="mt-3 space-y-2">
        {checks.map((check) => (
          <li
            key={check}
            className="flex items-center gap-2 text-xs text-[#6b6b6b]"
          >
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#e6f4ea] text-[#1e7a3c]">
              <IconCheck className="size-3" />
            </span>
            {check}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function HeroCanvas({ preview }: { preview: string }) {
  const t = useT();
  return (
    <div className="mx-4 rounded-[28px] bg-[#f0f0f0] sm:mx-8 lg:mx-[72px]">
      <div className="flex items-center justify-between px-7 pt-6 text-[11px] text-[#969696]">
        <span className="inline-flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#b5b5b5]" />
          {t("landing.canvasTitle")}
        </span>
        <span className="tabular-nums">{t("landing.canvasSize")}</span>
      </div>
      <div className="relative px-5 pb-10 pt-8 sm:px-10 lg:px-16 lg:pb-16 lg:pt-12">
        <figure className="relative mx-auto max-w-[760px]">
          <figcaption className="mb-2 text-[11px] text-[#969696]">
            {t("landing.canvasCaption")}
          </figcaption>
          <img
            src={preview}
            alt={t("landing.previewAlt")}
            width={1200}
            height={847}
            className="block h-auto w-full rounded-[2px] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04),0_24px_60px_-30px_rgba(0,0,0,0.3)] outline outline-1 outline-[#5b8def]/60"
          />
        </figure>
        <ProposalCard className="mt-6 lg:absolute lg:left-10 lg:top-[38%] lg:mt-0" />
        <CheckCard className="mt-4 lg:absolute lg:bottom-14 lg:right-10 lg:mt-0" />
      </div>
    </div>
  );
}

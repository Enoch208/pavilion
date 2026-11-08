import { appPath } from "@agent-native/core/client/api-path";
import { useSession } from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import { useMemo } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { EVENTS_PATH } from "@/hooks/use-navigation-state";
import { APP_TITLE } from "@/lib/app-config";

import { novaPreviewUrl } from "./nova-preview";
import { useStartDemo } from "./use-start-demo";

function Step(props: { number: number; title: string; body: string }) {
  return (
    <li>
      <span className="font-mono text-xs text-muted-foreground">
        {props.number}
      </span>
      <h2 className="mt-1 text-sm font-semibold">{props.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{props.body}</p>
    </li>
  );
}

function DemoAction() {
  const t = useT();
  const { session, status } = useSession();
  const demo = useStartDemo();
  if (session) {
    return (
      <Button size="lg" asChild>
        <Link to={EVENTS_PATH}>{t("landing.open")}</Link>
      </Button>
    );
  }
  return (
    <div>
      <Button
        size="lg"
        onClick={demo.start}
        disabled={demo.pending || status === "loading"}
      >
        {demo.pending ? t("landing.starting") : t("landing.tryDemo")}
      </Button>
      {demo.failed ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {demo.failed.message ?? t("landing.startFailed")}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("landing.demoNote")}
        </p>
      )}
    </div>
  );
}

export function LandingPage() {
  const t = useT();
  const preview = useMemo(novaPreviewUrl, []);
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <span className="text-sm font-semibold">{APP_TITLE}</span>
        <a
          href={appPath("/sign-in")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("landing.signIn")}
        </a>
      </header>
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-14 pt-6 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:pt-14">
        <section>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("landing.title")}
          </h1>
          <p className="mt-4 max-w-prose text-pretty text-muted-foreground">
            {t("landing.pitch")}
          </p>
          <div className="mt-8">
            <DemoAction />
          </div>
        </section>
        <figure className="overflow-hidden rounded-xl border border-border bg-white">
          <img
            src={preview}
            alt={t("landing.previewAlt")}
            width={1200}
            height={847}
            className="block h-auto w-full"
          />
          <figcaption className="border-t border-stone-200 bg-stone-50 px-4 py-2 text-xs text-stone-600">
            {t("landing.previewCaption")}
          </figcaption>
        </figure>
      </main>
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <ol className="grid gap-6 border-t border-border pt-10 md:grid-cols-3">
          <Step
            number={1}
            title={t("landing.stepEditTitle")}
            body={t("landing.stepEditBody")}
          />
          <Step
            number={2}
            title={t("landing.stepAskTitle")}
            body={t("landing.stepAskBody")}
          />
          <Step
            number={3}
            title={t("landing.stepApplyTitle")}
            body={t("landing.stepApplyBody")}
          />
        </ol>
      </section>
    </div>
  );
}

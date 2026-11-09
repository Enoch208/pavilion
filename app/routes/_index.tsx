import type { MetaArgs } from "react-router";

import { LandingPage } from "@/components/landing/LandingPage";
import { APP_TITLE } from "@/lib/app-config";

const TITLE = `${APP_TITLE} · Plan an event floor with an agent`;
const DESCRIPTION =
  "A floor planner where you and an AI agent edit one event layout through the same actions, a layout engine checks every change, and redesigns wait for you to apply them.";
const IMAGE_ALT =
  "Pavilion: plan the room, check every move. A scaled floor plan of the Nova Product Launch with an agent proposal adding 20 seats.";

type LandingData = { origin: string | null };

export function loader(): LandingData {
  return { origin: process.env.APP_URL ?? null };
}

function socialImage(origin: string) {
  const image = new URL("/og.png", origin).toString();
  return [
    { property: "og:url", content: new URL("/", origin).toString() },
    { property: "og:image", content: image },
    { property: "og:image:secure_url", content: image },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: IMAGE_ALT },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: IMAGE_ALT },
  ];
}

export function meta({ loaderData }: MetaArgs<typeof loader>) {
  return [
    { title: TITLE },
    { name: "description", content: DESCRIPTION },
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESCRIPTION },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: TITLE },
    { name: "twitter:description", content: DESCRIPTION },
    ...(loaderData?.origin ? socialImage(loaderData.origin) : []),
  ];
}

export default function IndexRoute() {
  return <LandingPage />;
}

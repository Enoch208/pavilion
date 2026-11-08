import { LandingPage } from "@/components/landing/LandingPage";
import { APP_TITLE } from "@/lib/app-config";

const TITLE = `${APP_TITLE} · Plan an event floor with an agent`;
const DESCRIPTION =
  "A floor planner where you and an AI agent edit one event layout through the same actions, a layout engine checks every change, and redesigns wait for you to apply them.";

export function meta() {
  return [
    { title: TITLE },
    { name: "description", content: DESCRIPTION },
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESCRIPTION },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: TITLE },
    { name: "twitter:description", content: DESCRIPTION },
  ];
}

export default function IndexRoute() {
  return <LandingPage />;
}

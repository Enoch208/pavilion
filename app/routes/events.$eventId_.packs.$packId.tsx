import { useParams } from "react-router";

import { SetupPackPage } from "@/components/pack/SetupPackPage";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: `Setup pack - ${APP_TITLE}` }];
}

export default function SetupPackRoute() {
  const { eventId = "", packId = "" } = useParams();
  return <SetupPackPage key={packId} eventId={eventId} packId={packId} />;
}

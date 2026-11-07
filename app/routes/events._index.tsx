import { EventsPage } from "@/components/events/EventsPage";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: `Events - ${APP_TITLE}` }];
}

export default function EventsRoute() {
  return <EventsPage />;
}

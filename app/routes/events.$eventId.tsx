import { useParams } from "react-router";

import { FloorPlanPage } from "@/components/plan/FloorPlanPage";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: `Floor plan - ${APP_TITLE}` }];
}

export default function EventFloorPlanRoute() {
  const { eventId = "" } = useParams();
  return <FloorPlanPage key={eventId} eventId={eventId} />;
}

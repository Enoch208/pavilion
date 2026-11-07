import type { LayoutView } from "../../../shared/contracts/view.js";
import { findIssues } from "../../../shared/geometry/index.js";
import { summarizeLayout } from "../../../shared/layout/summary.js";
import { getDb } from "../../db/index.js";
import { reject } from "../errors.js";
import { findPendingProposal, toProposalView } from "../proposals/records.js";
import type { Scope } from "../scope.js";
import { findEvent, loadObjects } from "./load.js";
import { toShape } from "./records.js";

export async function buildLayoutView(
  scope: Scope,
  eventId: string,
): Promise<LayoutView> {
  return (
    (await findLayoutView(scope, eventId)) ??
    reject("NOT_FOUND", "That event does not exist.")
  );
}

export async function findLayoutView(
  scope: Scope,
  eventId: string,
): Promise<LayoutView | null> {
  const found = await findEvent(scope, eventId);
  if (!found) return null;
  const { event, venue, plan } = found;
  const objects = await loadObjects(getDb(), scope, plan.id);
  const proposal = await findPendingProposal(getDb(), scope, plan.id);
  return {
    event: {
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      eventDate: event.eventDate,
      attendeeTarget: event.attendeeTarget,
      currency: event.currency,
      budgetCents: event.budgetCents,
      isDemo: event.demoKey !== null,
    },
    venue: {
      name: venue.name,
      widthMm: venue.widthMm,
      heightMm: venue.heightMm,
      unitDisplay: venue.unitDisplay,
    },
    plan: {
      id: plan.id,
      version: plan.version,
      mode: plan.mode,
      status: plan.status,
      minAisleMm: plan.minAisleMm,
    },
    objects,
    summary: summarizeLayout({
      attendeeTarget: event.attendeeTarget,
      budgetCents: event.budgetCents,
      objects,
    }),
    issues: findIssues(objects.map(toShape), venue),
    proposal: proposal ? toProposalView(proposal, plan.version) : null,
  };
}

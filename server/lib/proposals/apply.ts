import { and, eq } from "drizzle-orm";

import type { PlacedObject } from "../../../shared/contracts/layout.js";
import { findIssues } from "../../../shared/geometry/index.js";
import { describeIssues } from "../../../shared/layout/describe.js";
import { toShape } from "../../../shared/layout/shape.js";
import { getDb, schema, type Tx } from "../../db/index.js";
import { failAfterWrite, reject } from "../errors.js";
import { recordChange } from "../layout/commit.js";
import { loadObjects, requireEventRow, requirePlan } from "../layout/load.js";
import {
  applyRequirements,
  replaceObjects,
  saveVersion,
} from "../layout/snapshot.js";
import type { Scope } from "../scope.js";
import {
  requireProposal,
  toProposalView,
  type ProposalRow,
} from "./records.js";

function assertLocksKept(
  current: readonly PlacedObject[],
  proposed: readonly PlacedObject[],
) {
  const byId = new Map(proposed.map((object) => [object.id, object]));
  const disturbed = current.filter(
    (object) =>
      object.locked &&
      JSON.stringify(byId.get(object.id)) !== JSON.stringify(object),
  );
  if (disturbed.length === 0) return;
  reject(
    "LAYOUT_INVALID",
    `The proposal changes locked ${disturbed.map((object) => object.label).join(", ")}. Generate a new proposal.`,
    { objectIds: disturbed.map((object) => object.id) },
  );
}

async function close(
  tx: Tx,
  scope: Scope,
  proposal: ProposalRow,
  status: "accepted" | "rejected" | "stale",
) {
  const { layoutProposals } = schema;
  await tx
    .update(layoutProposals)
    .set({ status, decidedAt: new Date() })
    .where(
      and(
        eq(layoutProposals.id, proposal.id),
        eq(layoutProposals.ownerEmail, scope.ownerEmail),
      ),
    );
}

function assertPending(proposal: ProposalRow) {
  if (proposal.status === "pending") return;
  reject("PROPOSAL_CLOSED", `This proposal is already ${proposal.status}.`, {
    proposalId: proposal.id,
    status: proposal.status,
  });
}

export async function applyProposal(scope: Scope, proposalId: string) {
  const outcome = await getDb().transaction(async (tx) => {
    const proposal = await requireProposal(tx, scope, proposalId);
    const { plan, venue } = await requirePlan(tx, scope, proposal.planId);
    assertPending(proposal);
    if (proposal.baseVersion !== plan.version) {
      await close(tx, scope, proposal, "stale");
      return {
        stale: true as const,
        baseVersion: proposal.baseVersion,
        version: plan.version,
      };
    }
    const proposed = toProposalView(proposal, plan.version);
    const current = await loadObjects(tx, scope, plan.id);
    assertLocksKept(current, proposed.objects);
    const issues = findIssues(proposed.objects.map(toShape), venue);
    if (issues.length > 0) {
      const labels = new Map(
        proposed.objects.map((object) => [object.id, object.label]),
      );
      reject(
        "LAYOUT_INVALID",
        describeIssues(issues, (id) => labels.get(id) ?? id),
        { issues },
      );
    }
    const event = await requireEventRow(tx, scope, plan.eventId);
    await saveVersion(tx, scope, {
      planId: plan.id,
      version: plan.version,
      reason: "Before a proposal was applied",
      state: {
        objects: current,
        attendeeTarget: event.attendeeTarget,
        mode: plan.mode,
        minAisleMm: plan.minAisleMm,
      },
    });
    const next = {
      attendeeTarget: proposed.attendeeTarget,
      mode: proposed.mode,
      minAisleMm: proposed.minAisleMm,
    };
    await replaceObjects(tx, scope, plan.id, proposed.objects);
    await applyRequirements(
      tx,
      scope,
      { planId: plan.id, eventId: plan.eventId },
      next,
    );
    const version = await recordChange(tx, scope, plan, {
      action: "apply-proposal",
      summary: `Applied proposal: ${proposal.summary}`,
      payload: { proposalId: proposal.id },
    });
    await saveVersion(tx, scope, {
      planId: plan.id,
      version,
      reason: `Applied: ${proposal.summary}`,
      state: { ...next, objects: proposed.objects },
    });
    await close(tx, scope, proposal, "accepted");
    return { stale: false as const, planId: plan.id, version };
  });
  if (outcome.stale) {
    failAfterWrite(
      "PROPOSAL_STALE",
      `The plan changed after this proposal was made (it was based on version ${outcome.baseVersion}; the plan is now version ${outcome.version}). Nothing was applied. Generate a new proposal from the current plan.`,
      {
        proposalId,
        baseVersion: outcome.baseVersion,
        version: outcome.version,
      },
    );
  }
  return { proposalId, planId: outcome.planId, version: outcome.version };
}

export function discardProposal(scope: Scope, proposalId: string) {
  return getDb().transaction(async (tx) => {
    const proposal = await requireProposal(tx, scope, proposalId);
    assertPending(proposal);
    await close(tx, scope, proposal, "rejected");
    return { proposalId, status: "rejected" as const };
  });
}

import { randomUUID } from "node:crypto";

import type { PackSource } from "../../../shared/contracts/export.js";
import { buildSetupPack } from "../../../shared/export/pack.js";
import { getDb, schema } from "../../db/index.js";
import { reject } from "../errors.js";
import { recordNote } from "../layout/commit.js";
import { loadObjects, requireEventRow, requirePlan } from "../layout/load.js";
import type { Scope } from "../scope.js";
import { packPath } from "./records.js";

export type ExportInput = {
  planId: string;
  expectedVersion?: number | undefined;
};

export function exportSetupPack(scope: Scope, input: ExportInput) {
  return getDb().transaction(async (tx) => {
    const { plan, venue } = await requirePlan(tx, scope, input.planId);
    const expected = input.expectedVersion;
    if (expected !== undefined && expected !== plan.version) {
      reject(
        "VERSION_CONFLICT",
        `The plan changed since you looked at it (now version ${plan.version}, you sent ${expected}). Look at the current plan, then export again.`,
        {
          planId: plan.id,
          expectedVersion: expected,
          actualVersion: plan.version,
        },
      );
    }
    const event = await requireEventRow(tx, scope, plan.eventId);
    const objects = await loadObjects(tx, scope, plan.id);
    const id = randomUUID();
    const createdAt = new Date();
    const source: PackSource = {
      event: {
        title: event.title,
        eventType: event.eventType,
        eventDate: event.eventDate,
        attendeeTarget: event.attendeeTarget,
        currency: event.currency,
        budgetCents: event.budgetCents,
      },
      venue: {
        name: venue.name,
        widthMm: venue.widthMm,
        heightMm: venue.heightMm,
      },
      plan: {
        version: plan.version,
        mode: plan.mode,
        minAisleMm: plan.minAisleMm,
      },
      objects,
      exportedAt: createdAt.toISOString(),
    };
    await tx.insert(schema.setupPacks).values({
      id,
      planId: plan.id,
      eventId: event.id,
      ownerEmail: scope.ownerEmail,
      version: plan.version,
      source,
      createdBy: scope.actor,
      createdAt,
    });
    await recordNote(tx, scope, plan, {
      action: "export-setup-pack",
      summary: `Exported the setup pack for version ${plan.version}`,
      payload: { packId: id },
    });
    const pack = buildSetupPack(source);
    return {
      packId: id,
      eventId: event.id,
      planId: plan.id,
      version: plan.version,
      exportedAt: source.exportedAt,
      path: packPath(event.id, id),
      summary: pack.summary,
      currency: event.currency,
      items: pack.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        widthMm: item.widthMm,
        depthMm: item.depthMm,
        unitCostCents: item.unitCostCents,
        lineCostCents: item.lineCostCents,
      })),
      seatingRows: pack.rows.length,
      issues: pack.issues,
    };
  });
}

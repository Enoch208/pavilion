import { findIssues } from "../../../shared/geometry/index.js";
import { toShape } from "../../../shared/layout/shape.js";
import { getDb } from "../../db/index.js";
import { reject } from "../errors.js";
import { recordChange } from "../layout/commit.js";
import { loadObjects, requireEventRow, requirePlan } from "../layout/load.js";
import {
  applyRequirements,
  replaceObjects,
  saveVersion,
} from "../layout/snapshot.js";
import type { Scope } from "../scope.js";
import { requireVersion, stateOf } from "./history.js";

export function restoreVersion(
  scope: Scope,
  input: { versionId: string; expectedVersion: number },
) {
  return getDb().transaction(async (tx) => {
    const saved = await requireVersion(tx, scope, input.versionId);
    const { plan, venue } = await requirePlan(tx, scope, saved.planId);
    if (plan.version !== input.expectedVersion) {
      reject(
        "VERSION_CONFLICT",
        `The layout changed since you opened the history (now version ${plan.version}). Check the history again before restoring.`,
        { expectedVersion: input.expectedVersion, actualVersion: plan.version },
      );
    }
    const target = stateOf(saved);
    if (findIssues(target.objects.map(toShape), venue).length > 0) {
      reject("LAYOUT_INVALID", "That saved version no longer fits this venue.");
    }
    const event = await requireEventRow(tx, scope, plan.eventId);
    const current = await loadObjects(tx, scope, plan.id);
    await saveVersion(tx, scope, {
      planId: plan.id,
      version: plan.version,
      reason: `Before restoring version ${saved.version}`,
      state: {
        objects: current,
        attendeeTarget: event.attendeeTarget,
        mode: plan.mode,
        minAisleMm: plan.minAisleMm,
      },
    });
    await replaceObjects(tx, scope, plan.id, target.objects);
    await applyRequirements(
      tx,
      scope,
      { planId: plan.id, eventId: plan.eventId },
      target,
    );
    const version = await recordChange(tx, scope, plan, {
      action: "restore-version",
      summary: `Restored version ${saved.version} (${saved.reason})`,
      payload: { versionId: saved.id, restoredVersion: saved.version },
    });
    return { planId: plan.id, version, restoredVersion: saved.version };
  });
}

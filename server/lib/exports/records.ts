import { and, eq } from "drizzle-orm";

import {
  PackSource,
  type SetupPackRecord,
} from "../../../shared/contracts/export.js";
import { getDb, schema } from "../../db/index.js";
import { reject } from "../errors.js";
import type { Scope } from "../scope.js";

export function packPath(eventId: string, packId: string): string {
  return `/events/${encodeURIComponent(eventId)}/packs/${encodeURIComponent(packId)}`;
}

export async function requireSetupPack(
  scope: Scope,
  packId: string,
): Promise<SetupPackRecord> {
  const { setupPacks } = schema;
  const [row] = await getDb()
    .select()
    .from(setupPacks)
    .where(
      and(
        eq(setupPacks.id, packId),
        eq(setupPacks.ownerEmail, scope.ownerEmail),
      ),
    );
  if (!row) reject("NOT_FOUND", "That setup pack does not exist.");
  return {
    id: row.id,
    eventId: row.eventId,
    planId: row.planId,
    version: row.version,
    createdBy: row.createdBy,
    source: PackSource.parse(row.source),
  };
}

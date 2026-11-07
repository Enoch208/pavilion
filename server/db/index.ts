import { createGetDb } from "@agent-native/core/db";

import * as schema from "./schema.js";

export const getDb = createGetDb(schema);
export { schema };

export type Db = ReturnType<typeof getDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbLike = Db | Tx;

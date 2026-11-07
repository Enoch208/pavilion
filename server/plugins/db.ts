import { runMigrations } from "@agent-native/core/db";

import { PAVILION_MIGRATIONS } from "../db/migrations.js";

export default runMigrations(PAVILION_MIGRATIONS, {
  table: "pavilion_migrations",
});

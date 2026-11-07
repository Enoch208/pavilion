import type { MigrationEntry } from "@agent-native/core/db";

export const PAVILION_MIGRATIONS: MigrationEntry[] = [
  {
    version: 1,
    name: "pavilion_layout_core_v1",
    sql: `
CREATE TABLE IF NOT EXISTS pv_events (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  demo_key TEXT,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TEXT,
  attendee_target INTEGER NOT NULL CHECK (attendee_target >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  budget_cents INTEGER NOT NULL CHECK (budget_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pv_events_owner_created_idx ON pv_events (owner_email, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS pv_events_owner_demo_uq ON pv_events (owner_email, demo_key);

CREATE TABLE IF NOT EXISTS pv_venues (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES pv_events(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  name TEXT NOT NULL,
  width_mm INTEGER NOT NULL CHECK (width_mm > 0),
  height_mm INTEGER NOT NULL CHECK (height_mm > 0),
  unit_display TEXT NOT NULL DEFAULT 'm' CHECK (unit_display IN ('m', 'ft'))
);
CREATE UNIQUE INDEX IF NOT EXISTS pv_venues_event_uq ON pv_venues (event_id);

CREATE TABLE IF NOT EXISTS pv_layout_plans (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES pv_events(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
  mode TEXT NOT NULL CHECK (mode IN ('theatre', 'banquet', 'workshop', 'exhibition')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS pv_layout_plans_event_uq ON pv_layout_plans (event_id);

CREATE TABLE IF NOT EXISTS pv_placed_objects (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES pv_layout_plans(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  x_mm INTEGER NOT NULL,
  y_mm INTEGER NOT NULL,
  width_mm INTEGER NOT NULL CHECK (width_mm > 0),
  height_mm INTEGER NOT NULL CHECK (height_mm > 0),
  rotation_deg INTEGER NOT NULL DEFAULT 0 CHECK (rotation_deg IN (0, 90, 180, 270)),
  locked BOOLEAN NOT NULL DEFAULT false,
  capacity INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  unit_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_cost_cents >= 0),
  catalog_item_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pv_placed_objects_plan_idx ON pv_placed_objects (plan_id, owner_email);

CREATE TABLE IF NOT EXISTS pv_layout_actions (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES pv_layout_plans(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (actor IN ('human', 'agent', 'system')),
  action TEXT NOT NULL,
  version INTEGER NOT NULL,
  summary TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pv_layout_actions_plan_created_idx ON pv_layout_actions (plan_id, created_at);
`,
  },
];

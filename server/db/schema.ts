import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const instant = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

export const events = pgTable("pv_events", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  demoKey: text("demo_key"),
  title: text("title").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: text("event_date"),
  attendeeTarget: integer("attendee_target").notNull(),
  currency: text("currency").notNull().default("USD"),
  budgetCents: integer("budget_cents").notNull(),
  createdAt: instant("created_at").notNull().defaultNow(),
  updatedAt: instant("updated_at").notNull().defaultNow(),
});

export const venues = pgTable("pv_venues", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  name: text("name").notNull(),
  widthMm: integer("width_mm").notNull(),
  heightMm: integer("height_mm").notNull(),
  unitDisplay: text("unit_display", { enum: ["m", "ft"] })
    .notNull()
    .default("m"),
});

export const layoutPlans = pgTable("pv_layout_plans", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  version: integer("version").notNull().default(0),
  mode: text("mode", {
    enum: ["theatre", "banquet", "workshop", "exhibition"],
  }).notNull(),
  status: text("status", { enum: ["draft", "approved"] })
    .notNull()
    .default("draft"),
  minAisleMm: integer("min_aisle_mm").notNull().default(1200),
  updatedAt: instant("updated_at").notNull().defaultNow(),
});

export const placedObjects = pgTable("pv_placed_objects", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  xMm: integer("x_mm").notNull(),
  yMm: integer("y_mm").notNull(),
  widthMm: integer("width_mm").notNull(),
  heightMm: integer("height_mm").notNull(),
  rotationDeg: integer("rotation_deg").notNull().default(0),
  locked: boolean("locked").notNull().default(false),
  capacity: integer("capacity").notNull().default(0),
  unitCostCents: integer("unit_cost_cents").notNull().default(0),
  catalogItemId: text("catalog_item_id"),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdAt: instant("created_at").notNull().defaultNow(),
});

export const layoutActions = pgTable("pv_layout_actions", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  actor: text("actor", { enum: ["human", "agent", "system"] }).notNull(),
  action: text("action").notNull(),
  version: integer("version").notNull(),
  summary: text("summary").notNull(),
  payload: jsonb("payload")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdAt: instant("created_at").notNull().defaultNow(),
});

const layoutMode = (name: string) =>
  text(name, { enum: ["theatre", "banquet", "workshop", "exhibition"] });

export const layoutProposals = pgTable("pv_layout_proposals", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  baseVersion: integer("base_version").notNull(),
  mode: layoutMode("mode").notNull(),
  attendeeTarget: integer("attendee_target").notNull(),
  minAisleMm: integer("min_aisle_mm").notNull(),
  objects: jsonb("objects").$type<unknown[]>().notNull(),
  report: jsonb("report").$type<Record<string, unknown>>().notNull(),
  summary: text("summary").notNull(),
  status: text("status", {
    enum: ["pending", "accepted", "rejected", "stale"],
  })
    .notNull()
    .default("pending"),
  createdBy: text("created_by", {
    enum: ["human", "agent", "system"],
  }).notNull(),
  createdAt: instant("created_at").notNull().defaultNow(),
  decidedAt: instant("decided_at"),
});

export const layoutVersions = pgTable("pv_layout_versions", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  version: integer("version").notNull(),
  reason: text("reason").notNull(),
  objects: jsonb("objects").$type<unknown[]>().notNull(),
  attendeeTarget: integer("attendee_target").notNull(),
  mode: layoutMode("mode").notNull(),
  minAisleMm: integer("min_aisle_mm").notNull(),
  createdAt: instant("created_at").notNull().defaultNow(),
});

export const setupPacks = pgTable("pv_setup_packs", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull(),
  eventId: text("event_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  version: integer("version").notNull(),
  source: jsonb("source").$type<Record<string, unknown>>().notNull(),
  createdBy: text("created_by", {
    enum: ["human", "agent", "system"],
  }).notNull(),
  createdAt: instant("created_at").notNull().defaultNow(),
});

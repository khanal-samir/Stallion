import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid, unique, varchar, index } from "drizzle-orm/pg-core";
import { id, timestamps } from "./common.js";
import { user } from "./auth.js";
import { workspaces } from "./workspaces.js";

export const orgs = pgTable(
  "orgs",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    domain: varchar("domain", { length: 255 }),
    industry: varchar("industry", { length: 100 }),
    size: varchar("size", { length: 50 }),
    location: varchar("location", { length: 255 }),
    customFields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (table) => [
    unique("orgs_workspace_name_unique").on(table.workspaceId, table.name),
    index("orgs_workspace_id_idx").on(table.workspaceId),
  ],
);

export const people = pgTable(
  "people",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").references(() => orgs.id, { onDelete: "set null" }),
    ownerId: uuid("owner_id").references(() => user.id, { onDelete: "set null" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    jobTitle: varchar("job_title", { length: 255 }),
    linkedinUrl: varchar("linkedin_url", { length: 500 }),
    status: text("status", {
      enum: ["lead", "prospect", "qualified", "customer", "churned"],
    })
      .notNull()
      .default("lead"),
    source: text("source", { enum: ["manual", "csv", "api"] })
      .notNull()
      .default("manual"),
    lastContactedAt: timestamp("last_contacted_at"),
    customFields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (table) => [
    unique("people_workspace_email_unique").on(table.workspaceId, table.email),
    index("people_workspace_id_idx").on(table.workspaceId),
    index("people_org_id_idx").on(table.orgId),
    index("people_owner_id_idx").on(table.ownerId),
    index("people_email_idx").on(table.email),
    index("people_status_idx").on(table.status),
  ],
);

export const deals = pgTable(
  "deals",
  {
    ...id,
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    personId: uuid("person_id").references(() => people.id, { onDelete: "set null" }),
    orgId: uuid("org_id").references(() => orgs.id, { onDelete: "set null" }),
    ownerId: uuid("owner_id").references(() => user.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    value: text("value"),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    stage: text("stage", {
      enum: ["new", "contacted", "demo", "proposal", "won", "lost"],
    })
      .notNull()
      .default("new"),
    closeDate: timestamp("close_date"),
    ...timestamps,
  },
  (table) => [
    index("deals_workspace_id_idx").on(table.workspaceId),
    index("deals_person_id_idx").on(table.personId),
    index("deals_org_id_idx").on(table.orgId),
    index("deals_owner_id_idx").on(table.ownerId),
    index("deals_stage_idx").on(table.stage),
    index("deals_close_date_idx").on(table.closeDate),
  ],
);

export const orgsRelations = relations(orgs, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [orgs.workspaceId], references: [workspaces.id] }),
  people: many(people),
  deals: many(deals),
}));

export const peopleRelations = relations(people, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [people.workspaceId],
    references: [workspaces.id],
  }),
  org: one(orgs, { fields: [people.orgId], references: [orgs.id] }),
  owner: one(user, { fields: [people.ownerId], references: [user.id] }),
  deals: many(deals),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [deals.workspaceId],
    references: [workspaces.id],
  }),
  person: one(people, { fields: [deals.personId], references: [people.id] }),
  org: one(orgs, { fields: [deals.orgId], references: [orgs.id] }),
  owner: one(user, { fields: [deals.ownerId], references: [user.id] }),
}));

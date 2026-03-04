import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, unique, varchar, index, jsonb } from "drizzle-orm/pg-core";
import { id, timestamps } from "./common.js";
import { user } from "./auth.js";

export const workspaces = pgTable(
  "workspaces",
  {
    ...id,
    name: varchar({ length: 255 }).notNull(),
    ownerId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: varchar({ length: 255 }).notNull(),
    logo: text(),
    metadata: jsonb().$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (table) => [
    unique("workspaces_slug_unique").on(table.slug),
    index("workspaces_owner_id_idx").on(table.ownerId),
    index("workspaces_slug_idx").on(table.slug),
  ],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    ...id,
    workspaceId: uuid()
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text({ enum: ["admin", "member"] })
      .notNull()
      .default("member"),
    joinedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    unique("workspace_members_workspace_user_unique").on(table.workspaceId, table.userId),
    index("workspace_members_workspace_id_idx").on(table.workspaceId),
    index("workspace_members_user_id_idx").on(table.userId),
  ],
);

export const workspaceInvites = pgTable(
  "workspace_invites",
  {
    ...id,
    workspaceId: uuid()
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: varchar({ length: 255 }).notNull(),
    role: text({ enum: ["admin", "member"] })
      .notNull()
      .default("member"),
    token: varchar({ length: 255 }).unique(),
    status: text({ enum: ["pending", "accepted", "rejected", "canceled"] })
      .notNull()
      .default("pending"),
    expiresAt: timestamp().notNull(),
    createdBy: uuid().references(() => user.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    index("workspace_invites_workspace_id_idx").on(table.workspaceId),
    index("workspace_invites_email_idx").on(table.email),
    index("workspace_invites_status_idx").on(table.status),
    index("workspace_invites_expires_at_idx").on(table.expiresAt),
    index("workspace_invites_created_by_idx").on(table.createdBy),
  ],
);

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(user, { fields: [workspaces.ownerId], references: [user.id] }),
  members: many(workspaceMembers),
  invites: many(workspaceInvites),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(user, { fields: [workspaceMembers.userId], references: [user.id] }),
}));

export const workspaceInvitesRelations = relations(workspaceInvites, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceInvites.workspaceId],
    references: [workspaces.id],
  }),
  createdByUser: one(user, {
    fields: [workspaceInvites.createdBy],
    references: [user.id],
  }),
}));

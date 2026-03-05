import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { id, timestamps } from "./common.schema.js";

export const user = pgTable(
  "user",
  {
    ...id,
    name: text().notNull(),
    email: text().notNull().unique(),
    emailVerified: boolean().notNull().default(false),
    image: text(),
    ...timestamps,
  },
  (table) => [index("user_email_idx").on(table.email)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const session = pgTable(
  "session",
  {
    ...id,
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: uuid(),
    token: text().notNull().unique(),
    expiresAt: timestamp().notNull(),
    ipAddress: text(),
    userAgent: text(),
    ...timestamps,
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const account = pgTable(
  "account",
  {
    ...id,
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text().notNull(),
    providerId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    accessTokenExpiresAt: timestamp(),
    refreshTokenExpiresAt: timestamp(),
    scope: text(),
    idToken: text(),
    password: text(),
    ...timestamps,
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    index("account_provider_idx").on(table.providerId, table.accountId),
  ],
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const verification = pgTable(
  "verification",
  {
    ...id,
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp().notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

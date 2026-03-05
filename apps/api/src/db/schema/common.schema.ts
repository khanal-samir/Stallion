import { timestamp, uuid } from "drizzle-orm/pg-core";

export const id = {
  id: uuid().primaryKey().defaultRandom(),
};

export const timestamps = {
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
};

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env.config.js";
import * as schema from "./schema/index.js";

export const dbClient = postgres(env.DATABASE_URL);

export const db = drizzle(dbClient, { schema, casing: "snake_case" });

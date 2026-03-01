import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(currentDirectory, ".env"), quiet: true });
config({ path: resolve(currentDirectory, "../../.env"), quiet: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Add it to apps/api/.env or the repo root .env before running Drizzle commands.",
  );
}

export default defineConfig({
  out: "./src/db/drizzle",
  schema: "./src/db/schema/**/!(index).ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: databaseUrl,
  },
});

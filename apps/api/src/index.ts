import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { userRoutes } from "./routes/users.js";

const app = new Hono();

app.use("*", logger());

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/users", userRoutes);

const port = Number(process.env["PORT"] );

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`API running on ${port}`);
});

process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  server.close();
  process.exit(0);
});

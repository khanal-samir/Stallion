import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { auth } from "./lib/auth.js";
import { userRoutes } from "./routes/users.js";

const app = new Hono();

app.use("*", logger());

app.use(
  "*",
  cors({
    origin: process.env.WEB_URL!,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/users", userRoutes);

const port = Number(process.env.PORT!);

console.log(`API running on ${port}`);

export default {
  port,
  fetch: app.fetch,
};

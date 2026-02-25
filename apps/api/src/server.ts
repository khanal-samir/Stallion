import { Hono } from "hono";
import { logger } from "hono/logger";
import { auth } from "./lib/auth.js";
import { corsMiddleware } from "./lib/cors.js";
import { notFoundHandler, onErrorHandler } from "./lib/http-handlers.js";
import { userRoutes } from "./routes/users.js";

const app = new Hono();

app.use("*", logger());
app.use("*", corsMiddleware);

app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/users", userRoutes);

app.notFound(notFoundHandler);
app.onError(onErrorHandler);

const port = Number(process.env.PORT!);

console.log(`API running on ${port}`);

export default {
  port,
  fetch: app.fetch,
};

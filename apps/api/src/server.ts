import { Hono } from "hono";
import { logger } from "hono/logger";
import { corsMiddleware } from "./lib/cors.js";
import { notFoundHandler, onErrorHandler } from "./lib/http-handlers.js";
import { registerRoutes } from "./routes/index.js";

const app = new Hono();

app.use("*", logger());
app.use("*", corsMiddleware);

registerRoutes(app);

app.notFound(notFoundHandler);
app.onError(onErrorHandler);

const port = Number(process.env.PORT!);

console.log(`API running on ${port}`);

export default {
  port,
  fetch: app.fetch,
};

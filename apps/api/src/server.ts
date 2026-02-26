import { Hono } from "hono";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { corsMiddleware } from "./lib/cors.js";
import { notFoundHandler, onErrorHandler } from "./lib/http-handlers.js";
import { requestLogger } from "./middlewares/request-logger.js";
import { registerRoutes } from "./routes/index.js";

const app = new Hono();

app.use("*", requestLogger); // Logs route, method, status code, and duration for all requests
app.use("*", corsMiddleware);

registerRoutes(app);

app.notFound(notFoundHandler);
app.onError(onErrorHandler);
logger.info("API running", { port: env.PORT });

export default {
  port: env.PORT,
  fetch: app.fetch,
};

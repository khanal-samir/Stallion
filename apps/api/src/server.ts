import { Hono } from "hono";
import { requestLogger } from "./middlewares/request-logger.js";
import { corsMiddleware } from "./lib/cors.js";
import { registerRoutes } from "./routes/index.js";
import { notFoundHandler, onErrorHandler } from "./lib/http-handlers.js";
import { env } from "./config/env.config.js";

const app = new Hono();

app.use("*", requestLogger); // Logs route, method, status code, and duration for all requests
app.use("*", corsMiddleware);

registerRoutes(app);

app.notFound(notFoundHandler);
app.onError(onErrorHandler);

export default {
  port: env.PORT,
  fetch: app.fetch,
};

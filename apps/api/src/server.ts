import { Hono } from "hono";
import { env } from "./config/env.js";
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

export default {
  port: env.PORT,
  fetch: app.fetch,
};

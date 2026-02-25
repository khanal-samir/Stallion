import type { Hono } from "hono";
import { registerAuthRoutes } from "./auth.js";
import { registerHealthRoutes } from "./health.js";
import { registerUserRoutes } from "./users.js";

export function registerRoutes(app: Hono) {
  registerAuthRoutes(app);
  registerHealthRoutes(app);
  registerUserRoutes(app);
}

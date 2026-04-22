import type { Hono } from "hono";
import { authRoutes } from "./auth.route.js";
import { dealRoutes } from "./deals.route.js";
import { healthRoutes } from "./health.route.js";
import { orgRoutes } from "./org.route.js";
import { peopleRoutes } from "./people.route.js";

export function registerRoutes(app: Hono) {
  app.route("/api/auth", authRoutes);
  app.route("/health", healthRoutes);
  app.route("/org", orgRoutes);
  app.route("/people", peopleRoutes);
  app.route("/deals", dealRoutes);
}

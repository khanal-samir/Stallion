import type { Hono } from "hono";
import { authRoutes } from "./auth.route.js";
import { dealRoutes } from "./deals.route.js";
import { healthRoutes } from "./health.route.js";
import { orgRoutes } from "./orgs.route.js";
import { peopleRoutes } from "./people.route.js";
import { userRoutes } from "./users.route.js";

export function registerRoutes(app: Hono) {
  app.route("/api/auth", authRoutes);
  app.route("/health", healthRoutes);
  app.route("/users", userRoutes);
  app.route("/orgs", orgRoutes);
  app.route("/people", peopleRoutes);
  app.route("/deals", dealRoutes);
}

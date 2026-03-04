import type { Hono } from "hono";
import { authRoutes } from "./auth.js";
import { dealRoutes } from "./deals.js";
import { healthRoutes } from "./health.js";
import { orgRoutes } from "./orgs.js";
import { peopleRoutes } from "./people.js";
import { userRoutes } from "./users.js";

export function registerRoutes(app: Hono) {
  app.route("/api/auth", authRoutes);
  app.route("/health", healthRoutes);
  app.route("/users", userRoutes);
  app.route("/orgs", orgRoutes);
  app.route("/people", peopleRoutes);
  app.route("/deals", dealRoutes);
}

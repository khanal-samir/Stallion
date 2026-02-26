import type { Hono } from "hono";
import { authRoutes } from "./auth.js";
import { healthRoutes } from "./health.js";
import { userRoutes } from "./users.js";

export function registerRoutes(app: Hono) {
  app.route("/api/auth", authRoutes);
  app.route("/health", healthRoutes);
  app.route("/users", userRoutes);
}

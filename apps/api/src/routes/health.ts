import type { Hono } from "hono";
import { getHealth } from "../controllers/health.controller.js";

export function registerHealthRoutes(app: Hono) {
  app.get("/health", getHealth);
}

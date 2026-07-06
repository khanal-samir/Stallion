import { Hono } from "hono";
import { authMiddleware } from "@/middlewares/auth-middleware.js";
import {
  pipelineByStage,
  peopleByStatus,
  winRate,
} from "@/controllers/analytics.controller.js";

export const analyticsRoutes = new Hono()
  .use("*", authMiddleware)
  .get("/pipeline", (c) => pipelineByStage(c))
  .get("/people-status", (c) => peopleByStatus(c))
  .get("/win-rate", (c) => winRate(c));

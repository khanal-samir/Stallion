import { Hono } from "hono";
import { getHealth } from "../controllers/health.controller.js";

export const healthRoutes = new Hono().get("/", getHealth);

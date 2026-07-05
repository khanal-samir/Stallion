import { Hono } from "hono";
import { completeCrmTour, getOnboardingStatus } from "@/controllers/onboarding.controller.js";
import { authMiddleware } from "@/middlewares/auth-middleware.js";

export const onboardingRoutes = new Hono()
  .use("*", authMiddleware)
  .get("/", (c) => getOnboardingStatus(c))
  .post("/crm-tour/complete", (c) => completeCrmTour(c));

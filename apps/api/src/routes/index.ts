import type { Hono } from "hono";
import { analyticsRoutes } from "./analytics.route.js";
import { authRoutes } from "./auth.route.js";
import { dealRoutes } from "./deals.route.js";
import { healthRoutes } from "./health.route.js";
import { importRoutes } from "./imports.route.js";
import { importWebhookRoutes } from "./import-webhook.route.js";
import { orgRoutes } from "./org.route.js";
import { peopleRoutes } from "./people.route.js";
import { onboardingRoutes } from "./onboarding.route.js";
import { sequenceRoutes } from "./sequences.route.js";
import { sequenceUnsubscribeRoutes } from "./sequence-unsubscribe.route.js";

export function registerRoutes(app: Hono) {
  app.route("/api/auth", authRoutes);
  app.route("/health", healthRoutes);
  app.route("/org", orgRoutes);
  app.route("/people", peopleRoutes);
  app.route("/deals", dealRoutes);
  app.route("/analytics", analyticsRoutes);
  app.route("/onboarding", onboardingRoutes);
  app.route("/sequences", sequenceRoutes);
  app.route("/sequence-unsubscribe", sequenceUnsubscribeRoutes);
  app.route("/imports", importRoutes);
  app.route("/import-webhook", importWebhookRoutes);
}

import { Hono } from "hono";
import { webhookIngestSchema } from "@workspace/validators/schemas/import";
import { ingestWebhookController } from "@/controllers/imports.controller.js";
import { VALIDATION_TARGET } from "@/constants/validation-targets.js";
import { validateRequest } from "@/middlewares/validate-request.js";

/**
 * Deliberately outside the session-auth middleware. This is the generic inbound endpoint
 * that Zapier, Make, n8n, and custom scripts push to, so it authenticates with a workspace
 * API key in the Authorization header instead of a browser session.
 *
 * One endpoint here substitutes for a long tail of native connectors.
 */
export const importWebhookRoutes = new Hono().post(
  "/",
  validateRequest(VALIDATION_TARGET.JSON, webhookIngestSchema),
  (c) => ingestWebhookController(c, c.req.valid(VALIDATION_TARGET.JSON)),
);

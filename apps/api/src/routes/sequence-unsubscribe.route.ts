import { Hono } from "hono";
import { unsubscribeTokenParamsSchema } from "@workspace/validators/schemas/sequence";
import { VALIDATION_TARGET } from "@/constants/validation-targets.js";
import {
  confirmUnsubscribeController,
  previewUnsubscribeController,
} from "@/controllers/sequences.controller.js";
import { validateRequest } from "@/middlewares/validate-request.js";

export const sequenceUnsubscribeRoutes = new Hono()
  .get("/:token", validateRequest(VALIDATION_TARGET.PARAM, unsubscribeTokenParamsSchema), (c) => {
    const { token } = c.req.valid(VALIDATION_TARGET.PARAM);
    return previewUnsubscribeController(c, token);
  })
  .post("/:token", validateRequest(VALIDATION_TARGET.PARAM, unsubscribeTokenParamsSchema), (c) => {
    const { token } = c.req.valid(VALIDATION_TARGET.PARAM);
    return confirmUnsubscribeController(c, token);
  });

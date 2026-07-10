import { Hono } from "hono";
import {
  connectGmailSchema,
  createSequenceSchema,
  enrollPeopleSchema,
  generateEmailContentSchema,
  gmailIntegrationParamsSchema,
  listEnrollmentsQuerySchema,
  listSequencesQuerySchema,
  sequenceEnrollmentParamsSchema,
  sequenceParamsSchema,
  sequenceStepParamsSchema,
  sequenceTaskParamsSchema,
  updateSequenceSchema,
  updateSequenceStepSchema,
} from "@workspace/validators/schemas/sequence";
import { VALIDATION_TARGET } from "@/constants/validation-targets.js";
import {
  archiveSequenceController,
  completeSequenceTaskController,
  connectGmailController,
  createSequenceController,
  deleteSequenceController,
  disconnectGmailController,
  enrollPeopleController,
  generateEmailContentController,
  getSequenceController,
  getSequenceDashboardController,
  listGmailIntegrationsController,
  listSequenceActivityController,
  listSequenceEnrollmentsController,
  listSequencesController,
  pauseEnrollmentController,
  publishSequenceController,
  resumeEnrollmentController,
  updateSequenceController,
  updateSequenceStepController,
} from "@/controllers/sequences.controller.js";
import { authMiddleware } from "@/middlewares/auth-middleware.js";
import { validateRequest } from "@/middlewares/validate-request.js";

export const sequenceRoutes = new Hono()
  .use("*", authMiddleware)
  .get("/dashboard", (c) => getSequenceDashboardController(c))
  .get("/gmail", (c) => listGmailIntegrationsController(c))
  .post("/gmail", validateRequest(VALIDATION_TARGET.JSON, connectGmailSchema), (c) =>
    connectGmailController(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .delete(
    "/gmail/:gmailIntegrationId",
    validateRequest(VALIDATION_TARGET.PARAM, gmailIntegrationParamsSchema),
    (c) => {
      const { gmailIntegrationId } = c.req.valid(VALIDATION_TARGET.PARAM);
      return disconnectGmailController(c, gmailIntegrationId);
    },
  )
  .post("/generate-email", validateRequest(VALIDATION_TARGET.JSON, generateEmailContentSchema), (c) =>
    generateEmailContentController(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .patch(
    "/enrollments/:enrollmentId/pause",
    validateRequest(VALIDATION_TARGET.PARAM, sequenceEnrollmentParamsSchema),
    (c) => {
      const { enrollmentId } = c.req.valid(VALIDATION_TARGET.PARAM);
      return pauseEnrollmentController(c, enrollmentId);
    },
  )
  .patch(
    "/enrollments/:enrollmentId/resume",
    validateRequest(VALIDATION_TARGET.PARAM, sequenceEnrollmentParamsSchema),
    (c) => {
      const { enrollmentId } = c.req.valid(VALIDATION_TARGET.PARAM);
      return resumeEnrollmentController(c, enrollmentId);
    },
  )
  .patch(
    "/tasks/:taskId/complete",
    validateRequest(VALIDATION_TARGET.PARAM, sequenceTaskParamsSchema),
    (c) => {
      const { taskId } = c.req.valid(VALIDATION_TARGET.PARAM);
      return completeSequenceTaskController(c, taskId);
    },
  )
  .get("/", validateRequest(VALIDATION_TARGET.QUERY, listSequencesQuerySchema), (c) =>
    listSequencesController(c, c.req.valid(VALIDATION_TARGET.QUERY)),
  )
  .post("/", validateRequest(VALIDATION_TARGET.JSON, createSequenceSchema), (c) =>
    createSequenceController(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .get("/:id", validateRequest(VALIDATION_TARGET.PARAM, sequenceParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return getSequenceController(c, id);
  })
  .patch(
    "/:id",
    validateRequest(VALIDATION_TARGET.PARAM, sequenceParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, updateSequenceSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return updateSequenceController(c, id, c.req.valid(VALIDATION_TARGET.JSON));
    },
  )
  .delete("/:id", validateRequest(VALIDATION_TARGET.PARAM, sequenceParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return deleteSequenceController(c, id);
  })
  .patch(
    "/:id/steps/:stepId",
    validateRequest(VALIDATION_TARGET.PARAM, sequenceStepParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, updateSequenceStepSchema),
    (c) => {
      const { id, stepId } = c.req.valid(VALIDATION_TARGET.PARAM);
      return updateSequenceStepController(c, id, stepId, c.req.valid(VALIDATION_TARGET.JSON));
    },
  )
  .post("/:id/publish", validateRequest(VALIDATION_TARGET.PARAM, sequenceParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return publishSequenceController(c, id);
  })
  .post("/:id/archive", validateRequest(VALIDATION_TARGET.PARAM, sequenceParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return archiveSequenceController(c, id);
  })
  .post(
    "/:id/enrollments",
    validateRequest(VALIDATION_TARGET.PARAM, sequenceParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, enrollPeopleSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return enrollPeopleController(c, id, c.req.valid(VALIDATION_TARGET.JSON));
    },
  )
  .get(
    "/:id/enrollments",
    validateRequest(VALIDATION_TARGET.PARAM, sequenceParamsSchema),
    validateRequest(VALIDATION_TARGET.QUERY, listEnrollmentsQuerySchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return listSequenceEnrollmentsController(c, id, c.req.valid(VALIDATION_TARGET.QUERY));
    },
  )
  .get("/:id/activity", validateRequest(VALIDATION_TARGET.PARAM, sequenceParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return listSequenceActivityController(c, id);
  });

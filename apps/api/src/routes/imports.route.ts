import { Hono } from "hono";
import { z } from "zod";
import {
  connectionParamsSchema,
  createConnectionSchema,
  importEntityTypeSchema,
  importJobParamsSchema,
  listImportJobsQuerySchema,
  listImportRecordsQuerySchema,
  startImportJobSchema,
  updateConnectionSchema,
  updateImportJobSchema,
} from "@workspace/validators/schemas/import";
import {
  cancelImportJobController,
  commitImportJobController,
  createApiKeyController,
  createConnectionController,
  deleteConnectionController,
  getImportJobController,
  listApiKeysController,
  listConnectionsController,
  listImportJobsController,
  listImportRecordsController,
  previewConnectionFieldsController,
  revokeApiKeyController,
  startImportJobController,
  updateConnectionController,
  updateImportJobController,
} from "@/controllers/imports.controller.js";
import { VALIDATION_TARGET } from "@/constants/validation-targets.js";
import { authMiddleware } from "@/middlewares/auth-middleware.js";
import { validateRequest } from "@/middlewares/validate-request.js";

const createApiKeySchema = z.object({ name: z.string().trim().min(1).max(255) });
const previewQuerySchema = z.object({ entityType: importEntityTypeSchema.default("person") });

export const importRoutes = new Hono()
  .use("*", authMiddleware)
  .get("/connections", (c) => listConnectionsController(c))
  .post(
    "/connections",
    validateRequest(VALIDATION_TARGET.JSON, createConnectionSchema),
    (c) => createConnectionController(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .get(
    "/connections/:id/fields",
    validateRequest(VALIDATION_TARGET.PARAM, connectionParamsSchema),
    validateRequest(VALIDATION_TARGET.QUERY, previewQuerySchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      const { entityType } = c.req.valid(VALIDATION_TARGET.QUERY);
      return previewConnectionFieldsController(c, id, entityType);
    },
  )
  .patch(
    "/connections/:id",
    validateRequest(VALIDATION_TARGET.PARAM, connectionParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, updateConnectionSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return updateConnectionController(c, id, c.req.valid(VALIDATION_TARGET.JSON));
    },
  )
  .delete(
    "/connections/:id",
    validateRequest(VALIDATION_TARGET.PARAM, connectionParamsSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return deleteConnectionController(c, id);
    },
  )
  .get("/api-keys", (c) => listApiKeysController(c))
  .post("/api-keys", validateRequest(VALIDATION_TARGET.JSON, createApiKeySchema), (c) =>
    createApiKeyController(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .delete(
    "/api-keys/:id",
    validateRequest(VALIDATION_TARGET.PARAM, connectionParamsSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return revokeApiKeyController(c, id);
    },
  )
  .get("/jobs", validateRequest(VALIDATION_TARGET.QUERY, listImportJobsQuerySchema), (c) =>
    listImportJobsController(c, c.req.valid(VALIDATION_TARGET.QUERY)),
  )
  .post("/jobs", validateRequest(VALIDATION_TARGET.JSON, startImportJobSchema), (c) =>
    startImportJobController(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .get("/jobs/:id", validateRequest(VALIDATION_TARGET.PARAM, importJobParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return getImportJobController(c, id);
  })
  .get(
    "/jobs/:id/records",
    validateRequest(VALIDATION_TARGET.PARAM, importJobParamsSchema),
    validateRequest(VALIDATION_TARGET.QUERY, listImportRecordsQuerySchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return listImportRecordsController(c, id, c.req.valid(VALIDATION_TARGET.QUERY));
    },
  )
  .patch(
    "/jobs/:id",
    validateRequest(VALIDATION_TARGET.PARAM, importJobParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, updateImportJobSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return updateImportJobController(c, id, c.req.valid(VALIDATION_TARGET.JSON));
    },
  )
  .post(
    "/jobs/:id/commit",
    validateRequest(VALIDATION_TARGET.PARAM, importJobParamsSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return commitImportJobController(c, id);
    },
  )
  .post(
    "/jobs/:id/cancel",
    validateRequest(VALIDATION_TARGET.PARAM, importJobParamsSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return cancelImportJobController(c, id);
    },
  );

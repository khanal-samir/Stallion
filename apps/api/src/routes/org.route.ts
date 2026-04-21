import { Hono } from "hono";
import {
  bulkDeleteSchema,
  createCustomFieldDefinitionSchema,
  customFieldParamsSchema,
  createOrgSchema,
  listOrgsQuerySchema,
  orgParamsSchema,
  updateCustomFieldDefinitionSchema,
  updateOrgSchema,
} from "@workspace/validators/schemas/crm";
import {
  bulkDeleteOrgs,
  createOrg,
  deleteOrg,
  getOrg,
  listOrgs,
  updateOrg,
} from "@/controllers/org.controller.js";
import {
  createCustomFieldDefinition,
  deleteCustomFieldDefinition,
  listCustomFieldDefinitions,
  updateCustomFieldDefinition,
} from "@/controllers/crm-custom-fields.controller.js";
import { VALIDATION_TARGET } from "@/constants/validation-targets.js";
import { authMiddleware } from "@/middlewares/auth-middleware.js";
import { customFieldsAuthMiddleware } from "@/middlewares/custom-fields-auth.js";
import { validateRequest } from "@/middlewares/validate-request.js";

export const orgRoutes = new Hono()
  .use("*", authMiddleware)
  .get("/", validateRequest(VALIDATION_TARGET.QUERY, listOrgsQuerySchema), (c) =>
    listOrgs(c, c.req.valid(VALIDATION_TARGET.QUERY)),
  )
  .get("/custom-fields", customFieldsAuthMiddleware,     (c) => listCustomFieldDefinitions(c, "org"))
  .post(
    "/custom-fields",
    customFieldsAuthMiddleware,
    validateRequest(VALIDATION_TARGET.JSON, createCustomFieldDefinitionSchema),
    (c) => createCustomFieldDefinition(c, "org", c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .patch(
    "/custom-fields/:id",
    customFieldsAuthMiddleware,
    validateRequest(VALIDATION_TARGET.PARAM, customFieldParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, updateCustomFieldDefinitionSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return updateCustomFieldDefinition(c, "org", id, c.req.valid(VALIDATION_TARGET.JSON));
    },
  )
  .delete(
    "/custom-fields/:id",
    customFieldsAuthMiddleware,
    validateRequest(VALIDATION_TARGET.PARAM, customFieldParamsSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return deleteCustomFieldDefinition(c, "org", id);
    },
  )
  .get("/:id", validateRequest(VALIDATION_TARGET.PARAM, orgParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return getOrg(c, id);
  })
  .post("/", validateRequest(VALIDATION_TARGET.JSON, createOrgSchema), (c) =>
    createOrg(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .patch(
    "/:id",
    validateRequest(VALIDATION_TARGET.PARAM, orgParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, updateOrgSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return updateOrg(c, id, c.req.valid(VALIDATION_TARGET.JSON));
    },
  )
  .delete("/bulk", validateRequest(VALIDATION_TARGET.JSON, bulkDeleteSchema), (c) =>
    bulkDeleteOrgs(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .delete("/:id", validateRequest(VALIDATION_TARGET.PARAM, orgParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return deleteOrg(c, id);
  });

import { Hono } from "hono";
import {
  bulkDeleteSchema,
  createCustomFieldDefinitionSchema,
  customFieldParamsSchema,
  createPersonSchema,
  listPeopleQuerySchema,
  personParamsSchema,
  updateCustomFieldDefinitionSchema,
  updatePersonSchema,
} from "@workspace/validators/schemas/crm";
import {
  bulkDeletePeople,
  createPerson,
  deletePerson,
  getPerson,
  listPeople,
  updatePerson,
} from "@/controllers/people.controller.js";
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

export const peopleRoutes = new Hono()
  .use("*", authMiddleware)
  .get("/", validateRequest(VALIDATION_TARGET.QUERY, listPeopleQuerySchema), (c) =>
    listPeople(c, c.req.valid(VALIDATION_TARGET.QUERY)),
  )
  .get("/custom-fields", customFieldsAuthMiddleware, (c) => listCustomFieldDefinitions(c, "people"))
  .post(
    "/custom-fields",
    customFieldsAuthMiddleware,
    validateRequest(VALIDATION_TARGET.JSON, createCustomFieldDefinitionSchema),
    (c) => createCustomFieldDefinition(c, "people", c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .patch(
    "/custom-fields/:id",
    customFieldsAuthMiddleware,
    validateRequest(VALIDATION_TARGET.PARAM, customFieldParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, updateCustomFieldDefinitionSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return updateCustomFieldDefinition(c, "people", id, c.req.valid(VALIDATION_TARGET.JSON));
    },
  )
  .delete(
    "/custom-fields/:id",
    customFieldsAuthMiddleware,
    validateRequest(VALIDATION_TARGET.PARAM, customFieldParamsSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return deleteCustomFieldDefinition(c, "people", id);
    },
  )
  .get("/:id", validateRequest(VALIDATION_TARGET.PARAM, personParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return getPerson(c, id);
  })
  .post("/", validateRequest(VALIDATION_TARGET.JSON, createPersonSchema), (c) =>
    createPerson(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .delete("/bulk", validateRequest(VALIDATION_TARGET.JSON, bulkDeleteSchema), (c) =>
    bulkDeletePeople(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .patch(
    "/:id",
    validateRequest(VALIDATION_TARGET.PARAM, personParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, updatePersonSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return updatePerson(c, id, c.req.valid(VALIDATION_TARGET.JSON));
    },
  )
  .delete("/:id", validateRequest(VALIDATION_TARGET.PARAM, personParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return deletePerson(c, id);
  });

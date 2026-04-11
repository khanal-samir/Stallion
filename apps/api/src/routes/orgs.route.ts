import { Hono } from "hono";
import {
  bulkDeleteSchema,
  createOrgSchema,
  orgParamsSchema,
  orgsListQuerySchema,
  updateOrgSchema,
} from "@workspace/validators/schemas/crm";
import {
  bulkDeleteOrgs,
  createOrg,
  deleteOrg,
  getOrg,
  listOrgs,
  updateOrg,
} from "@/controllers/orgs.controller.js";
import { VALIDATION_TARGET } from "@/constants/validation-targets.js";
import { authMiddleware } from "@/middlewares/auth-middleware.js";
import { validateRequest } from "@/middlewares/validate-request.js";

export const orgRoutes = new Hono()
  .use("*", authMiddleware)
  .get("/", validateRequest(VALIDATION_TARGET.QUERY, orgsListQuerySchema), (c) => {
    const query = c.req.valid(VALIDATION_TARGET.QUERY);
    return listOrgs(c, query);
  })
  .get("/:id", validateRequest(VALIDATION_TARGET.PARAM, orgParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return getOrg(c, id);
  })
  .post("/", validateRequest(VALIDATION_TARGET.JSON, createOrgSchema), (c) =>
    createOrg(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .post("/bulk-delete", validateRequest(VALIDATION_TARGET.JSON, bulkDeleteSchema), (c) => {
    const { ids } = c.req.valid(VALIDATION_TARGET.JSON);
    return bulkDeleteOrgs(c, ids);
  })
  .patch(
    "/:id",
    validateRequest(VALIDATION_TARGET.PARAM, orgParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, updateOrgSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return updateOrg(c, id, c.req.valid(VALIDATION_TARGET.JSON));
    },
  )
  .delete("/:id", validateRequest(VALIDATION_TARGET.PARAM, orgParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return deleteOrg(c, id);
  });

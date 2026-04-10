import { Hono } from "hono";
import {
  bulkDeleteSchema,
  createOrgSchema,
  listOrgsQuerySchema,
  orgParamsSchema,
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
  .get("/", validateRequest(VALIDATION_TARGET.QUERY, listOrgsQuerySchema), (c) =>
    listOrgs(c, c.req.valid(VALIDATION_TARGET.QUERY)),
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

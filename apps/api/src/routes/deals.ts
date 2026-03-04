import { Hono } from "hono";
import { createDealSchema, dealParamsSchema, updateDealSchema } from "@workspace/validators";
import {
  createDeal,
  deleteDeal,
  getDeal,
  listDeals,
  updateDeal,
} from "@/controllers/deals.controller.js";
import { VALIDATION_TARGET } from "@/constants/validation-targets.js";
import { authMiddleware } from "@/middlewares/auth-middleware.js";
import { validateRequest } from "@/middlewares/validate-request.js";

export const dealRoutes = new Hono()
  .use("*", authMiddleware)
  .get("/", listDeals)
  .get("/:id", validateRequest(VALIDATION_TARGET.PARAM, dealParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return getDeal(c, id);
  })
  .post("/", validateRequest(VALIDATION_TARGET.JSON, createDealSchema), (c) =>
    createDeal(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .patch(
    "/:id",
    validateRequest(VALIDATION_TARGET.PARAM, dealParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, updateDealSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return updateDeal(c, id, c.req.valid(VALIDATION_TARGET.JSON));
    },
  )
  .delete("/:id", validateRequest(VALIDATION_TARGET.PARAM, dealParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return deleteDeal(c, id);
  });

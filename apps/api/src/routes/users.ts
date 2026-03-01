import { Hono } from "hono";
import { createUserSchema, updateUserParamsSchema, updateUserSchema } from "@workspace/validators";
import { createUser, listUsers, updateUser } from "../controllers/users.controller.js";
import { VALIDATION_TARGET } from "../constants/validation-targets.js";
import { validateRequest } from "../middlewares/validate-request.js";

export const userRoutes = new Hono()
  .get("/", listUsers)
  .post("/", validateRequest(VALIDATION_TARGET.JSON, createUserSchema), (c) =>
    createUser(c, c.req.valid(VALIDATION_TARGET.JSON)),
  )
  .patch(
    "/:id",
    validateRequest(VALIDATION_TARGET.PARAM, updateUserParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, updateUserSchema),
    (c) => {
      const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
      return updateUser(c, id, c.req.valid(VALIDATION_TARGET.JSON));
    },
  );

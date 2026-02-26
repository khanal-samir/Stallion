import { Hono } from "hono";
import {
  createUserSchema,
  updateUserParamsSchema,
  updateUserSchema,
} from "@workspace/validators";
import {
  createUser,
  listUsers,
  updateUser,
} from "../controllers/users.controller.js";
import {
  validateRequest,
  VALIDATION_TARGET,
} from "../middlewares/validate-request.js";

export const userRoutes = new Hono()
  .get("/", listUsers)
  .post("/", validateRequest(VALIDATION_TARGET.JSON, createUserSchema), (c) =>
    createUser(c, c.req.valid("json")),
  )
  .patch(
    "/:id",
    validateRequest(VALIDATION_TARGET.PARAM, updateUserParamsSchema),
    validateRequest(VALIDATION_TARGET.JSON, updateUserSchema),
    (c) => {
      const { id } = c.req.valid("param");
      return updateUser(c, id, c.req.valid("json"));
    },
  );

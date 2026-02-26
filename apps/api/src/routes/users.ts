import { Hono, type Hono as HonoApp } from "hono";
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
import { validateRequest } from "../middlewares/validate-request.js";

export const userRoutes = new Hono()
  .get("/", listUsers)
  .post("/", validateRequest("json", createUserSchema), (c) =>
    createUser(c, c.req.valid("json")),
  )
  .patch(
    "/:id",
    validateRequest("param", updateUserParamsSchema),
    validateRequest("json", updateUserSchema),
    (c) => {
      const { id } = c.req.valid("param");
      return updateUser(c, id, c.req.valid("json"));
    },
  );

export function registerUserRoutes(app: HonoApp) {
  app.route("/users", userRoutes);
}

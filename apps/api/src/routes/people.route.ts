import { Hono } from "hono";
import {
  createPersonSchema,
  personParamsSchema,
  updatePersonSchema,
} from "@workspace/validators/schemas/crm";
import {
  createPerson,
  deletePerson,
  getPerson,
  listPeople,
  updatePerson,
} from "@/controllers/people.controller.js";
import { VALIDATION_TARGET } from "@/constants/validation-targets.js";
import { authMiddleware } from "@/middlewares/auth-middleware.js";
import { validateRequest } from "@/middlewares/validate-request.js";

export const peopleRoutes = new Hono()
  .use("*", authMiddleware)
  .get("/", listPeople)
  .get("/:id", validateRequest(VALIDATION_TARGET.PARAM, personParamsSchema), (c) => {
    const { id } = c.req.valid(VALIDATION_TARGET.PARAM);
    return getPerson(c, id);
  })
  .post("/", validateRequest(VALIDATION_TARGET.JSON, createPersonSchema), (c) =>
    createPerson(c, c.req.valid(VALIDATION_TARGET.JSON)),
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

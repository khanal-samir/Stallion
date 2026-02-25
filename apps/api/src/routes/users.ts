import { Hono } from "hono";
import { createUserSchema, updateUserSchema } from "@workspace/validators";

export const userRoutes = new Hono()
  .get("/", (c) => {
    return c.json({ users: [] });
  })
  .post("/", async (c) => {
    const body = await c.req.json();
    const result = createUserSchema.safeParse(body);

    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400);
    }

    return c.json({ user: result.data }, 201);
  })
  .patch("/:id", async (c) => {
    const body = await c.req.json();
    const result = updateUserSchema.safeParse(body);

    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400);
    }

    return c.json({ user: { id: c.req.param("id"), ...result.data } });
  });

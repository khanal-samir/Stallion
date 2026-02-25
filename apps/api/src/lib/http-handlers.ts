import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const notFoundHandler: NotFoundHandler = (c) => {
  return c.json(
    {
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404,
  );
};

export const onErrorHandler: ErrorHandler = (err, c) => {
  console.error(err);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json({ error: "Internal Server Error" }, 500);
};

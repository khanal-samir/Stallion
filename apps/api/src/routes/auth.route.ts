import { Hono, type Context } from "hono";
import { auth } from "@/lib/auth.config.js";

const authHandler = (c: Context) => {
  return auth.handler(c.req.raw);
};

export const authRoutes = new Hono()
  .on(["POST", "GET"], "/", authHandler)
  .on(["POST", "GET"], "/*", authHandler);

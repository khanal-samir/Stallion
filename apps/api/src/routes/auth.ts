import type { Hono } from "hono";
import { auth } from "../lib/auth.js";

export function registerAuthRoutes(app: Hono) {
  app.on(["POST", "GET"], "/api/auth/**", (c) => {
    return auth.handler(c.req.raw);
  });
}

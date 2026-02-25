import type { Context, Next } from "hono";
import { auth } from "./auth.js";

type AuthSession = typeof auth.$Infer.Session;

export interface AuthEnv {
  Variables: {
    user: AuthSession["user"];
    session: AuthSession["session"];
  };
}

export async function authMiddleware(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);

  return next();
}

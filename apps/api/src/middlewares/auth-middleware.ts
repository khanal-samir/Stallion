import type { Context, Next } from "hono";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { auth } from "@/lib/auth.js";
import { sendError } from "@/utils/api-response.js";
import { logger } from "@/config/logger.js";
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
    logger.warn("Failed to authenticate session");
    return sendError(c, "Unauthorized", STATUS_CODES.UNAUTHORIZED);
  }

  c.set("user", session.user);
  c.set("session", session.session);
  logger.info("User authenticated", { user: session.user });

  return next();
}

import { cors } from "hono/cors";
import { env } from "@/config/env.js";

export const corsMiddleware = cors({
  origin: env.WEB_URL,
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

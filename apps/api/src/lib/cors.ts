import { cors } from "hono/cors";

export const corsMiddleware = cors({
  origin: process.env.WEB_URL!,
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

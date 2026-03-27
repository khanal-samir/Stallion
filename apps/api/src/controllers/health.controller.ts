import type { Context } from "hono";
import { sendSuccess } from "@/lib/api-response.js";

export function getHealth(c: Context) {
  return sendSuccess(c, { status: "ok" });
}

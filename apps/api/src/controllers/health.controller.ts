import type { Context } from "hono";
import { sendSuccess } from "@/utils/api-response.js";

export function getHealth(c: Context) {
  return sendSuccess(c, { status: "ok" });
}

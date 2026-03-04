import type { Context } from "hono";
import { sendSuccess } from "@/helpers/api-response.js";

export function getHealth(c: Context) {
  return sendSuccess(c, { status: "ok" });
}

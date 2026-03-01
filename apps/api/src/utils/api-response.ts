import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { STATUS_CODES, type StatusCode } from "../constants/status-codes.js";
import { ApiErrorResponse, ApiSuccessResponse } from "@workspace/validators";

export function sendSuccess<T>(
  c: Context,
  data: T,
  statusCode: StatusCode = STATUS_CODES.OK,
  message?: string,
) {
  const response: ApiSuccessResponse<T> = message
    ? { success: true, data, message }
    : { success: true, data };

  return c.json(response, statusCode as ContentfulStatusCode);
}

export function sendError(c: Context, message: string, statusCode: StatusCode, details?: unknown) {
  const error = details === undefined ? { message } : { message, details };
  const response: ApiErrorResponse = {
    success: false,
    error,
  };

  return c.json(response, statusCode as ContentfulStatusCode);
}

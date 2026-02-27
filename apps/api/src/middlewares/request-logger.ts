import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "../config/logger.js";
import { STATUS_CODES } from "../constants/status-codes.js";
import { AppError } from "../utils/app-error.js";

export async function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  let error: unknown;
  try {
    await next();
  } catch (err) {
    error = err;
    throw err;
  } finally {
    const durationMs = Date.now() - start;
    const statusCode =
      error instanceof AppError
        ? error.statusCode
        : error instanceof HTTPException
          ? error.status
          : error
            ? STATUS_CODES.INTERNAL_SERVER_ERROR
            : c.res.status;

    logger.info(`${c.req.method} ${c.req.url} - ${statusCode} - ${durationMs}ms`);
  }
}

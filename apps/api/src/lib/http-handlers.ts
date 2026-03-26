import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { StatusCode } from "@/constants/status-codes.js";
import { logger } from "@/config/logger.config.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { AppError } from "@/helpers/app-error.js";
import { sendError } from "@/helpers/api-response.js";

export const notFoundHandler: NotFoundHandler = (c) => {
  return sendError(c, `Route ${c.req.method} ${c.req.path} not found`, STATUS_CODES.NOT_FOUND);
};

export const onErrorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException && c.req.path.startsWith("/api/auth")) {
    return err.getResponse(); // let betterauth handle auth errors
  }

  const statusCode: StatusCode =
    err instanceof AppError
      ? err.statusCode
      : err instanceof HTTPException
        ? (err.status as StatusCode)
        : STATUS_CODES.INTERNAL_SERVER_ERROR;

  const errorMessage = err instanceof Error ? err.message : "Unknown error";
  const details = err instanceof AppError ? err.details : undefined;

  // 5xx errors
  if (statusCode >= STATUS_CODES.INTERNAL_SERVER_ERROR) {
    logger.error(
      {
        statusCode,
        errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
      },
      "Unhandled error",
    );
    return sendError(c, "Internal Server Error", statusCode);
  }

  //4xx errors
  logger.warn(
    {
      statusCode,
      errorMessage,
      details,
    },
    "Request error",
  );

  return sendError(c, errorMessage, statusCode, details);
};

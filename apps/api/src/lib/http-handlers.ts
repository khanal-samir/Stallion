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
  if (err instanceof AppError) {
    logger.warn(
      {
        method: c.req.method,
        path: c.req.path,
        statusCode: err.statusCode,
        errorMessage: err.message,
        details: err.details,
      },
      "Operational error",
    );

    return sendError(c, err.message, err.statusCode, err.details);
  }

  if (err instanceof HTTPException) {
    logger.warn(
      {
        method: c.req.method,
        path: c.req.path,
        statusCode: err.status,
        errorMessage: err.message,
      },
      "HTTP exception",
    );

    if (c.req.path.startsWith("/api/auth")) {
      return err.getResponse();
    }

    return sendError(c, err.message, err.status as StatusCode);
  }

  logger.error(
    {
      method: c.req.method,
      path: c.req.path,
      errorMessage: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    },
    "Unhandled error",
  );

  return sendError(c, "Internal Server Error", STATUS_CODES.INTERNAL_SERVER_ERROR);
};

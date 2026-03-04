import { STATUS_CODES, type StatusCode } from "@/constants/status-codes.js";

export class AppError extends Error {
  readonly statusCode: StatusCode;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: StatusCode = STATUS_CODES.INTERNAL_SERVER_ERROR,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

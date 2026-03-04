import type { ValidationTargets } from "hono";
import { zValidator } from "@hono/zod-validator";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { VALIDATION_TARGET } from "@/constants/validation-targets.js";
import { AppError } from "@/helpers/app-error.js";

type ValidationSchema = {
  safeParse: (value: unknown) => unknown;
};

export function validateRequest(target: keyof ValidationTargets, schema: ValidationSchema) {
  return zValidator(target, schema as never, (result) => {
    if (result.success) {
      return;
    }

    const statusCode =
      target === VALIDATION_TARGET.JSON
        ? STATUS_CODES.UNPROCESSABLE_ENTITY
        : STATUS_CODES.BAD_REQUEST;

    throw new AppError("Validation failed", statusCode, result.error);
  });
}

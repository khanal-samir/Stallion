import type { ValidationTargets } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ZodError } from "zod";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { VALIDATION_TARGET } from "@/constants/validation-targets.js";
import { AppError } from "@/lib/app-error.js";

type ValidationSchema = {
  safeParse: (value: unknown) => unknown;
};

export function validateRequest(target: keyof ValidationTargets, schema: ValidationSchema) {
  return zValidator(target, schema as never, (result) => {
    if (result.success) return;

    const statusCode =
      target === VALIDATION_TARGET.JSON
        ? STATUS_CODES.UNPROCESSABLE_ENTITY
        : STATUS_CODES.BAD_REQUEST;

    const validationError = (result as { error?: unknown }).error;
    const details =
      validationError instanceof ZodError
        ? validationError.issues
            .map((issue) => {
              const path = issue.path.length > 0 ? issue.path.join(".") : target;
              return `${path}: ${issue.message}`;
            })
            .join(", ")
        : "Invalid request payload";

    throw new AppError("Validation failed", statusCode, details);
  });
}

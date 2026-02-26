import type { ValidationTargets } from "hono";
import { validator } from "hono/validator";
import { STATUS_CODES } from "../constants/status-codes.js";
import { AppError } from "../errors/app-error.js";

export const VALIDATION_TARGET = {
  JSON: "json",
  PARAM: "param",
  QUERY: "query",
} as const;

type SafeParseSuccess<TOutput> = {
  success: true;
  data: TOutput;
};

type SafeParseFailure = {
  success: false;
  error: {
    flatten: () => unknown;
  };
};

type SafeParseSchema<TInput, TOutput> = {
  safeParse: (value: TInput) => SafeParseSuccess<TOutput> | SafeParseFailure;
};

export function validateRequest<
  Target extends keyof ValidationTargets,
  TInput,
  TOutput,
>(target: Target, schema: SafeParseSchema<TInput, TOutput>) {
  return validator(target, (value: TInput) => { // hono validator middleware
    const result = schema.safeParse(value);

    if (!result.success) {
      const statusCode =
        target === VALIDATION_TARGET.JSON
          ? STATUS_CODES.UNPROCESSABLE_ENTITY
          : STATUS_CODES.BAD_REQUEST;

      throw new AppError(
        "Validation failed",
        statusCode,
        result.error.flatten(),
      );
    }

    return result.data;
  });
}

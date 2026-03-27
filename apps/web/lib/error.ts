import type { ApiErrorResponse } from "@workspace/validators/types/auth";
import axios from "axios";
import type { AxiosError } from "axios";

export type BetterAuthClientError = {
  code?: string;
  message?: string;
  status?: number;
  statusText?: string;
};

export type AppError = {
  code?: string;
  message: string;
  status?: number;
};

export type AppErrorInput = AxiosError<ApiErrorResponse> | BetterAuthClientError | Error;

export function isBetterAuthError(error: unknown): error is BetterAuthClientError {
  if (!error || typeof error !== "object" || axios.isAxiosError(error)) {
    return false;
  }

  const candidate = error as Record<string, unknown>;

  return (
    typeof candidate.message === "string" ||
    typeof candidate.status === "number" ||
    typeof candidate.statusText === "string" ||
    typeof candidate.code === "string"
  );
}

export function toBetterAuthError(
  error: BetterAuthClientError | null | undefined,
  fallbackMessage: string,
): BetterAuthClientError {
  return {
    ...error,
    message: error?.message ?? fallbackMessage,
  };
}

export function normalizeAppError(error: unknown): AppError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: { message?: string } }>;
    const message =
      axiosError.response?.data?.error?.message ??
      axiosError.response?.data?.message ??
      axiosError.message ??
      "Request failed";

    return {
      message,
      status: axiosError.response?.status,
    };
  }

  if (isBetterAuthError(error)) {
    return {
      code: error.code,
      message: error.message ?? error.statusText ?? "Request failed",
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "An unexpected error occurred" };
}

export function isHandledAppError(error: unknown): error is AppErrorInput {
  return axios.isAxiosError(error) || isBetterAuthError(error) || error instanceof Error;
}

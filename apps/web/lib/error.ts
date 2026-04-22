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
  details?: string;
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

function getFriendlyErrorMessage(status: number | undefined, rawMessage: string): string {
  if (status === 403) return "You don't have permission to do that";
  if (status === 401) return "Please sign in again";
  if (status === 404) return "Resource not found";
  if (status && status >= 500) return "Something went wrong. Please try again.";
  return rawMessage;
}

export function normalizeAppError(error: unknown): AppError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse | { message?: string }>;
    const responseData = axiosError.response?.data;
    const nestedError = responseData && "error" in responseData ? responseData.error : undefined;
    const rawMessage =
      nestedError?.message ??
      (responseData && "message" in responseData ? responseData.message : undefined) ??
      axiosError.message ??
      "Request failed";
    const status = axiosError.response?.status;

    return {
      details: nestedError?.details as string | undefined,
      message: getFriendlyErrorMessage(status, rawMessage),
      status,
    };
  }

  if (isBetterAuthError(error)) {
    const rawMessage = error.message ?? error.statusText ?? "Request failed";
    return {
      code: error.code,
      message: getFriendlyErrorMessage(error.status, rawMessage),
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

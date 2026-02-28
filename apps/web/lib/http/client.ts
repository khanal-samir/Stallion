import axios from "axios";
import type { AxiosError } from "axios";
import { env } from "@/config/env";

export type ApiError = {
  message: string;
  status?: number;
};

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

export function createServerApiClient(cookieHeader: string) {
  return axios.create({
    baseURL: env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    headers: {
      cookie: cookieHeader,
    },
  });
}

export function normalizeApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return { message: "An unexpected error occurred" };
  }

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

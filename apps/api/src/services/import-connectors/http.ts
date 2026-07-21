import { AppError } from "@/lib/app-error.js";
import { STATUS_CODES } from "@/constants/status-codes.js";
import type { FetchLike } from "./types.js";

/**
 * Signals that extraction should pause and resume from the persisted cursor rather than
 * fail the job. The worker reschedules using `retryAfterMs`.
 */
export class RateLimitError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Signals expired or revoked credentials. The service flags the connection
 * `reconnect_required` instead of retrying, because retrying cannot succeed.
 */
export class ConnectionAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionAuthError";
  }
}

const DEFAULT_RETRY_AFTER_MS = 60_000;
const MAX_RETRY_AFTER_MS = 3_600_000;

/**
 * `Retry-After` is either delta-seconds or an HTTP date. Both appear in the wild;
 * Google uses seconds, Microsoft Graph sometimes returns a date.
 */
export function parseRetryAfter(header: string | null, now: Date): number {
  if (!header) return DEFAULT_RETRY_AFTER_MS;

  const trimmed = header.trim();
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
  }

  const retryDate = new Date(trimmed);
  if (!Number.isNaN(retryDate.getTime())) {
    const delta = retryDate.getTime() - now.getTime();
    return Math.min(Math.max(delta, 0), MAX_RETRY_AFTER_MS);
  }

  return DEFAULT_RETRY_AFTER_MS;
}

export type JsonRequestInput = {
  url: string;
  accessToken: string;
  fetchImpl: FetchLike;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  now?: Date;
};

export async function requestJson<T>(input: JsonRequestInput): Promise<T> {
  const now = input.now ?? new Date();
  const response = await input.fetchImpl(input.url, {
    method: input.method ?? "GET",
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      accept: "application/json",
      ...(input.body === undefined ? {} : { "content-type": "application/json" }),
      ...input.headers,
    },
    ...(input.body === undefined ? {} : { body: JSON.stringify(input.body) }),
  });

  if (response.status === 429 || response.status === 503) {
    throw new RateLimitError(
      `Rate limited by ${new URL(input.url).host}`,
      parseRetryAfter(response.headers.get("retry-after"), now),
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new ConnectionAuthError(
      `Credentials rejected by ${new URL(input.url).host} with status ${response.status}`,
    );
  }

  if (!response.ok) {
    throw new AppError(
      `Request to ${new URL(input.url).host} failed with status ${response.status}`,
      STATUS_CODES.BAD_GATEWAY,
    );
  }

  return (await response.json()) as T;
}

export function buildUrl(base: string, params: Record<string, string | number | undefined>) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

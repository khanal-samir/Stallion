import { faker } from "@faker-js/faker";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { AppError } from "@/lib/app-error.js";
import { sendError, sendSuccess } from "@/lib/api-response.js";

const logger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/config/logger.config.js", () => ({ logger }));

import { notFoundHandler, onErrorHandler } from "@/lib/http-handlers.js";

describe("HTTP responses and errors", () => {
  beforeEach(() => {
    faker.seed(20260706);
  });

  it("supports success messages and explicit statuses", async () => {
    const message = faker.lorem.sentence();
    const app = new Hono().get("/", (c) =>
      sendSuccess(c, { id: faker.string.uuid() }, STATUS_CODES.CREATED, message),
    );

    const response = await app.request("/");

    expect(response.status).toBe(STATUS_CODES.CREATED);
    expect(await response.json()).toEqual({
      success: true,
      data: { id: expect.any(String) },
      message,
    });
  });

  it("returns errors with and without details", async () => {
    const app = new Hono()
      .get("/simple", (c) => sendError(c, "missing", STATUS_CODES.NOT_FOUND))
      .get("/detailed", (c) =>
        sendError(c, "invalid", STATUS_CODES.BAD_REQUEST, { field: "name" }),
      );

    await expect((await app.request("/simple")).json()).resolves.toEqual({
      success: false,
      error: { message: "missing" },
    });
    await expect((await app.request("/detailed")).json()).resolves.toEqual({
      success: false,
      error: { message: "invalid", details: { field: "name" } },
    });
  });

  it("formats not-found responses", async () => {
    const app = new Hono().notFound(notFoundHandler);

    const response = await app.request("/unknown", { method: "PATCH" });

    expect(response.status).toBe(STATUS_CODES.NOT_FOUND);
    expect(await response.json()).toMatchObject({
      error: { message: "Route PATCH /unknown not found" },
    });
  });

  it.each([
    ["application", new AppError("invalid", STATUS_CODES.UNPROCESSABLE_ENTITY, "details"), 422],
    ["HTTP", new HTTPException(403, { message: "forbidden" }), 403],
  ])("returns operational %s errors", async (_label, error, status) => {
    const app = new Hono()
      .get("/", () => {
        throw error;
      })
      .onError(onErrorHandler);

    const response = await app.request("/");

    expect(response.status).toBe(status);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("preserves Better Auth HTTP responses", async () => {
    const app = new Hono()
      .get("/api/auth/fail", () => {
        throw new HTTPException(429, { message: "rate limited" });
      })
      .onError(onErrorHandler);

    const response = await app.request("/api/auth/fail");

    expect(response.status).toBe(429);
    expect(await response.text()).toBe("rate limited");
  });

  it("hides unexpected server errors", async () => {
    const error = new Error("secret failure");
    const app = new Hono()
      .get("/", () => {
        throw error;
      })
      .onError(onErrorHandler);

    const response = await app.request("/");

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: { message: "Internal Server Error" },
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it("handles unknown non-Error values defensively", async () => {
    let context: Parameters<typeof onErrorHandler>[1] | undefined;
    const app = new Hono().get("/", (c) => {
      context = c;
      return c.body(null);
    });
    await app.request("/");

    const response = await onErrorHandler("non-error" as never, context!);

    expect(response.status).toBe(500);
  });
});

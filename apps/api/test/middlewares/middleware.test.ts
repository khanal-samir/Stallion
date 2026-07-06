import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { AppError } from "@/lib/app-error.js";
import { onErrorHandler } from "@/lib/http-handlers.js";
import { requestLogger } from "@/middlewares/request-logger.js";
import { validateRequest } from "@/middlewares/validate-request.js";

const logger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/config/logger.config.js", () => ({ logger }));

describe("request middleware", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValueOnce(100).mockReturnValue(125);
  });

  it("validates JSON and exposes parsed input", async () => {
    const app = new Hono()
      .post("/", validateRequest("json", z.object({ name: z.string().min(2) })), (c) =>
        c.json(c.req.valid("json")),
      )
      .onError(onErrorHandler);

    const valid = await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ada" }),
    });
    expect(await valid.json()).toEqual({ name: "Ada" });

    const invalid = await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "A" }),
    });
    expect(invalid.status).toBe(STATUS_CODES.UNPROCESSABLE_ENTITY);
    expect(await invalid.json()).toMatchObject({
      error: { message: "Validation failed", details: expect.stringContaining("name:") },
    });
  });

  it("uses bad request for invalid query data and handles non-Zod failures", async () => {
    const invalidResult = { success: false as const, error: "invalid" };
    const nonZodSchema = {
      safeParse: () => invalidResult,
      safeParseAsync: async () => invalidResult,
    };
    const app = new Hono()
      .get("/query", validateRequest("query", z.object({ page: z.coerce.number().min(1) })), (c) =>
        c.json(c.req.valid("query")),
      )
      .get("/other", validateRequest("query", nonZodSchema), (c) => c.body(null))
      .onError(onErrorHandler);

    expect((await app.request("/query?page=0")).status).toBe(STATUS_CODES.BAD_REQUEST);
    const other = await app.request("/other");
    expect(await other.json()).toMatchObject({
      error: { details: "Invalid request payload" },
    });
  });

  it("labels root-level validation issues with their request target", async () => {
    const app = new Hono()
      .get("/", validateRequest("query", z.string()), (c) => c.body(null))
      .onError(onErrorHandler);

    const response = await app.request("/");

    expect(await response.json()).toMatchObject({
      error: { details: expect.stringContaining("query:") },
    });
  });

  it.each([
    ["success", undefined, 204],
    ["application error", new AppError("bad", STATUS_CODES.BAD_REQUEST), 400],
    ["HTTP error", new HTTPException(404), 404],
    ["unknown error", new Error("bad"), 500],
  ])("logs status and duration for %s", async (_label, error, expectedStatus) => {
    const app = new Hono();
    app.use("*", requestLogger);
    app.get("/", (c) => {
      if (error) throw error;
      return c.body(null, 204);
    });
    app.onError(() => new Response(null, { status: expectedStatus }));

    await app.request("/");

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        path: "/",
        statusCode: expectedStatus,
        durationMs: 25,
      }),
      "HTTP request completed",
    );
  });

  it.each([
    new AppError("bad", STATUS_CODES.BAD_REQUEST),
    new HTTPException(404),
    new Error("bad"),
  ])("logs errors observed directly from downstream middleware", async (error) => {
    let context: Parameters<typeof requestLogger>[0] | undefined;
    const app = new Hono().get("/", (c) => {
      context = c;
      return c.body(null);
    });
    await app.request("/");

    await expect(requestLogger(context!, () => Promise.reject(error))).rejects.toBe(error);
    expect(logger.info).toHaveBeenCalled();
  });
});

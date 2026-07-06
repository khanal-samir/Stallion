import { faker } from "@faker-js/faker";
import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { getHealth } from "@/controllers/health.controller.js";
import { AppError } from "@/lib/app-error.js";
import { toDate } from "@/lib/date.js";
import { getTokenFromAuthUrl } from "@/lib/get-token-from-url.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";

describe("DB-free API helpers", () => {
  beforeEach(() => {
    faker.seed(20260706);
  });

  it("returns the health response through the public HTTP interface", async () => {
    const app = new Hono().get("/health", getHealth);

    const response = await app.request("/health");

    expect(response.status).toBe(STATUS_CODES.OK);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { status: "ok" },
    });
  });

  it("normalizes supported date inputs", () => {
    const date = faker.date.past();

    expect(toDate(undefined)).toBeUndefined();
    expect(toDate(date)).toBe(date);
    expect(toDate(date.toISOString())).toEqual(date);
  });

  it("extracts auth tokens from query strings and paths", () => {
    const token = faker.string.uuid();

    expect(getTokenFromAuthUrl(`https://api.example.test/verify?token=${token}`)).toBe(token);
    expect(getTokenFromAuthUrl(`https://api.example.test/verify/${token}`)).toBe(token);
    expect(getTokenFromAuthUrl("https://api.example.test")).toBeNull();
    expect(getTokenFromAuthUrl("not a url")).toBeNull();
  });

  it("returns the active workspace and rejects sessions without one", async () => {
    const workspaceId = faker.string.uuid();
    const app = new Hono<{
      Variables: { session: { activeOrganizationId?: string } };
    }>()
      .get("/with-workspace", (c) => {
        c.set("session", { activeOrganizationId: workspaceId });
        return c.json({ workspaceId: getSessionWorkspaceId(c) });
      })
      .get("/without-workspace", (c) => {
        getSessionWorkspaceId(c);
        return c.body(null);
      })
      .onError(() => new Response(null, { status: STATUS_CODES.INTERNAL_SERVER_ERROR }));

    const success = await app.request("/with-workspace");
    expect(await success.json()).toEqual({ workspaceId });

    const failure = await app.request("/without-workspace");
    expect(failure.status).toBe(STATUS_CODES.INTERNAL_SERVER_ERROR);
  });

  it("creates operational application errors with defaults and details", () => {
    const defaultError = new AppError("failed");
    const details = { field: faker.database.column() };
    const validationError = new AppError("invalid", STATUS_CODES.BAD_REQUEST, details);

    expect(defaultError).toMatchObject({
      name: "AppError",
      message: "failed",
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
      isOperational: true,
    });
    expect(validationError.details).toBe(details);
  });
});

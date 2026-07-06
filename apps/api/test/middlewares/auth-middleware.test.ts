import { faker } from "@faker-js/faker";
import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/auth.config.js", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/config/logger.config.js", () => ({ logger: mocks.logger }));

import { authMiddleware } from "@/middlewares/auth-middleware.js";

describe("authentication middleware", () => {
  beforeEach(() => {
    faker.seed(20260706);
  });

  it("rejects requests without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);
    const app = new Hono().use("*", authMiddleware).get("/", (c) => c.text("private"));

    const response = await app.request("/");

    expect(response.status).toBe(401);
    expect(mocks.logger.warn).toHaveBeenCalledWith("Failed to authenticate session");
  });

  it("adds authenticated user and session to context", async () => {
    const session = {
      user: { id: faker.string.uuid(), email: faker.internet.email() },
      session: { id: faker.string.uuid(), activeOrganizationId: faker.string.uuid() },
    };
    mocks.getSession.mockResolvedValueOnce(session);
    const app = new Hono<{
      Variables: { user: unknown; session: unknown };
    }>()
      .use("*", authMiddleware)
      .get("/", (c) => c.json({ user: c.get("user"), session: c.get("session") }));

    const response = await app.request("/", { headers: { cookie: "session=value" } });

    expect(await response.json()).toEqual(session);
    expect(mocks.getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
    expect(mocks.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ userId: session.user.id, sessionId: session.session.id }),
      "User authenticated",
    );
  });
});

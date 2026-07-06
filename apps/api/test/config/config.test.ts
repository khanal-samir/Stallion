import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("runtime configuration", () => {
  it("parses valid API environment values and defaults", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "development",
      DATABASE_URL: "postgres://example",
      WEB_URL: "https://web.example.test",
      BETTER_AUTH_SECRET: "x".repeat(32),
      BETTER_AUTH_URL: "https://api.example.test",
      RESEND_API_KEY: "key",
      RESEND_FROM_EMAIL: "test@example.test",
      GOOGLE_CLIENT_ID: "client",
      GOOGLE_CLIENT_SECRET: "secret",
    };
    delete process.env.PORT;

    const { env } = await import("@/config/env.config.js");

    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe("development");
  });

  it("reports all invalid environment values", async () => {
    process.env = { NODE_ENV: "test" };

    await expect(import("@/config/env.config.js")).rejects.toThrow(
      /Invalid environment variables:\nNODE_ENV:/,
    );
  });

  it("labels schema-level environment issues", async () => {
    vi.doMock("@workspace/validators/schemas/env", () => ({
      apiEnvSchema: {
        safeParse: () => ({
          success: false,
          error: { issues: [{ path: [], message: "invalid configuration" }] },
        }),
      },
    }));

    await expect(import("@/config/env.config.js")).rejects.toThrow("env: invalid configuration");
    vi.doUnmock("@workspace/validators/schemas/env");
  });

  it.each([
    ["production", "info"],
    ["development", "debug"],
  ])("sets %s logging to %s", async (nodeEnv, level) => {
    process.env.NODE_ENV = nodeEnv;

    const { logger } = await import("@/config/logger.config.js");

    expect(logger.level).toBe(level);
  });
});

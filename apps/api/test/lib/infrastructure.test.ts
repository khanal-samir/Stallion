import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));
vi.mock("@/config/env.config.js", () => ({
  env: {
    RESEND_API_KEY: "test-key",
    RESEND_FROM_EMAIL: "Stallion <test@example.test>",
    WEB_URL: "https://web.example.test",
  },
}));
vi.mock("@/config/logger.config.js", () => ({
  logger: { info: mocks.info, error: mocks.error },
}));

import { corsMiddleware } from "@/lib/cors.js";
import { sendEmail } from "@/lib/email.js";

describe("external infrastructure adapters", () => {
  beforeEach(() => {
    mocks.send.mockResolvedValue({ data: { id: "email-id" }, error: null });
  });

  it("sends email through the configured provider", async () => {
    await sendEmail({ to: "ada@example.test", subject: "Hello", html: "<p>Hello</p>" });

    expect(mocks.send).toHaveBeenCalledWith({
      from: "Stallion <test@example.test>",
      to: "ada@example.test",
      subject: "Hello",
      html: "<p>Hello</p>",
    });
    expect(mocks.info).toHaveBeenCalled();
  });

  it("logs and throws provider failures", async () => {
    mocks.send.mockResolvedValueOnce({ data: null, error: { message: "rejected" } });

    await expect(
      sendEmail({ to: "ada@example.test", subject: "Hello", html: "<p>Hello</p>" }),
    ).rejects.toThrow("Failed to send email: rejected");
    expect(mocks.error).toHaveBeenCalled();
  });

  it("applies the configured CORS policy", async () => {
    const app = new Hono().use("*", corsMiddleware).get("/", (c) => c.text("ok"));

    const response = await app.request("/", {
      method: "OPTIONS",
      headers: {
        origin: "https://web.example.test",
        "access-control-request-method": "PATCH",
        "access-control-request-headers": "Content-Type,Authorization",
      },
    });

    expect(response.headers.get("access-control-allow-origin")).toBe("https://web.example.test");
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
    expect(response.headers.get("access-control-allow-methods")).toContain("PATCH");
  });
});

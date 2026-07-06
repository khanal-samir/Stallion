import { Hono, type Context, type Next } from "hono";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  getWorkspaceId: vi.fn(() => "workspace-id"),
}));

vi.mock("@/utils/crm-custom-fields.js", () => ({
  assertCanManageCustomFields: mocks.authorize,
}));
vi.mock("@/lib/workspace.js", () => ({
  getSessionWorkspaceId: mocks.getWorkspaceId,
}));

import { customFieldsAuthMiddleware } from "@/middlewares/custom-fields-auth.js";

describe("custom-field authorization middleware", () => {
  it("authorizes the active workspace before continuing", async () => {
    const app = new Hono()
      .use("*", (c: Context, next: Next) => customFieldsAuthMiddleware(c, next))
      .get("/", (c) => c.text("ok"));

    const response = await app.request("/");

    expect(await response.text()).toBe("ok");
    expect(mocks.authorize).toHaveBeenCalledWith(expect.anything(), "workspace-id");
  });
});

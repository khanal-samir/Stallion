import { faker } from "@faker-js/faker";
import { Hono, type Context, type Next } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

const controller = vi.hoisted(() => {
  const respond = vi.fn((c: Context, ...args: unknown[]) => c.json({ args }));
  return {
    respond,
    pipelineByStage: respond,
    peopleByStatus: respond,
    winRate: respond,
    getOnboardingStatus: respond,
    completeCrmTour: respond,
    listDeals: respond,
    getDeal: respond,
    createDeal: respond,
    updateDeal: respond,
    deleteDeal: respond,
    listOrgs: respond,
    getOrg: respond,
    createOrg: respond,
    updateOrg: respond,
    deleteOrg: respond,
    bulkDeleteOrgs: respond,
    listPeople: respond,
    getPerson: respond,
    createPerson: respond,
    updatePerson: respond,
    deletePerson: respond,
    bulkDeletePeople: respond,
    listCustomFieldDefinitions: respond,
    createCustomFieldDefinition: respond,
    updateCustomFieldDefinition: respond,
    deleteCustomFieldDefinition: respond,
    authHandler: vi.fn(() => new Response("auth")),
  };
});

vi.mock("@/controllers/analytics.controller.js", () => ({
  pipelineByStage: controller.pipelineByStage,
  peopleByStatus: controller.peopleByStatus,
  winRate: controller.winRate,
}));
vi.mock("@/controllers/onboarding.controller.js", () => ({
  getOnboardingStatus: controller.getOnboardingStatus,
  completeCrmTour: controller.completeCrmTour,
}));
vi.mock("@/controllers/deals.controller.js", () => ({
  listDeals: controller.listDeals,
  getDeal: controller.getDeal,
  createDeal: controller.createDeal,
  updateDeal: controller.updateDeal,
  deleteDeal: controller.deleteDeal,
}));
vi.mock("@/controllers/org.controller.js", () => ({
  listOrgs: controller.listOrgs,
  getOrg: controller.getOrg,
  createOrg: controller.createOrg,
  updateOrg: controller.updateOrg,
  deleteOrg: controller.deleteOrg,
  bulkDeleteOrgs: controller.bulkDeleteOrgs,
}));
vi.mock("@/controllers/people.controller.js", () => ({
  listPeople: controller.listPeople,
  getPerson: controller.getPerson,
  createPerson: controller.createPerson,
  updatePerson: controller.updatePerson,
  deletePerson: controller.deletePerson,
  bulkDeletePeople: controller.bulkDeletePeople,
}));
vi.mock("@/controllers/crm-custom-fields.controller.js", () => ({
  listCustomFieldDefinitions: controller.listCustomFieldDefinitions,
  createCustomFieldDefinition: controller.createCustomFieldDefinition,
  updateCustomFieldDefinition: controller.updateCustomFieldDefinition,
  deleteCustomFieldDefinition: controller.deleteCustomFieldDefinition,
}));
vi.mock("@/middlewares/auth-middleware.js", () => ({
  authMiddleware: (_c: Context, next: Next) => next(),
}));
vi.mock("@/middlewares/custom-fields-auth.js", () => ({
  customFieldsAuthMiddleware: (_c: Context, next: Next) => next(),
}));
vi.mock("@/lib/auth.config.js", () => ({
  auth: { handler: controller.authHandler },
}));
vi.mock("@/config/env.config.js", () => ({
  env: { PORT: 3001, WEB_URL: "https://web.example.test" },
}));

import server from "@/server.js";
import { analyticsRoutes } from "@/routes/analytics.route.js";
import { authRoutes } from "@/routes/auth.route.js";
import { dealRoutes } from "@/routes/deals.route.js";
import { healthRoutes } from "@/routes/health.route.js";
import { onboardingRoutes } from "@/routes/onboarding.route.js";
import { orgRoutes } from "@/routes/org.route.js";
import { peopleRoutes } from "@/routes/people.route.js";
import { registerRoutes } from "@/routes/index.js";

const jsonRequest = (method: string, body?: unknown) => ({
  method,
  headers: { "content-type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

describe("API route wiring without database infrastructure", () => {
  beforeEach(() => {
    faker.seed(20260706);
  });

  it.each([
    [analyticsRoutes, "/pipeline", "GET"],
    [analyticsRoutes, "/people-status", "GET"],
    [analyticsRoutes, "/win-rate", "GET"],
    [onboardingRoutes, "/", "GET"],
    [onboardingRoutes, "/crm-tour/complete", "POST"],
  ])("dispatches %s %s routes", async (app, path, method) => {
    expect((await app.request(path, { method })).status).toBe(200);
  });

  it("dispatches every deals route with validated values", async () => {
    const id = faker.string.uuid();
    const cases: Array<[string, RequestInit | undefined]> = [
      ["/", undefined],
      [`/${id}`, undefined],
      ["/", jsonRequest("POST", { title: "Deal" })],
      [`/${id}`, jsonRequest("PATCH", { stage: "won" })],
      [`/${id}`, { method: "DELETE" }],
    ];

    for (const [path, init] of cases) {
      expect((await dealRoutes.request(path, init)).status).toBe(200);
    }
  });

  it.each([
    ["organizations", orgRoutes, { name: "Acme" }],
    ["people", peopleRoutes, { name: "Ada" }],
  ])("dispatches every %s and custom-field route", async (_name, app, createBody) => {
    const id = faker.string.uuid();
    const cases: Array<[string, RequestInit | undefined]> = [
      ["/", undefined],
      ["/custom-fields", undefined],
      ["/custom-fields", jsonRequest("POST", { label: "Region", type: "text" })],
      [`/custom-fields/${id}`, jsonRequest("PATCH", { label: "Territory" })],
      [`/custom-fields/${id}`, { method: "DELETE" }],
      [`/${id}`, undefined],
      ["/", jsonRequest("POST", createBody)],
      [`/${id}`, jsonRequest("PATCH", createBody)],
      ["/bulk", jsonRequest("DELETE", { ids: [id] })],
      [`/${id}`, { method: "DELETE" }],
    ];

    for (const [path, init] of cases) {
      expect((await app.request(path, init)).status).toBe(200);
    }
  });

  it("forwards GET and POST Better Auth requests", async () => {
    expect((await authRoutes.request("/session")).status).toBe(200);
    expect((await authRoutes.request("/sign-in", { method: "POST" })).status).toBe(200);
    expect(controller.authHandler).toHaveBeenCalledTimes(2);
  });

  it("registers the complete API and constructs the server export", async () => {
    const app = new Hono();
    registerRoutes(app);

    expect((await app.request("/health")).status).toBe(200);
    expect(server.port).toBe(3001);
    expect(server.fetch).toEqual(expect.any(Function));
    expect((await healthRoutes.request("/")).status).toBe(200);
  });
});

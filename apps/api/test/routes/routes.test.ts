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
    listSequencesController: respond,
    createSequenceController: respond,
    getSequenceController: respond,
    updateSequenceController: respond,
    updateSequenceStepController: respond,
    publishSequenceController: respond,
    archiveSequenceController: respond,
    deleteSequenceController: respond,
    enrollPeopleController: respond,
    listSequenceEnrollmentsController: respond,
    listSequenceActivityController: respond,
    pauseEnrollmentController: respond,
    resumeEnrollmentController: respond,
    completeSequenceTaskController: respond,
    getSequenceDashboardController: respond,
    listGmailIntegrationsController: respond,
    connectGmailController: respond,
    disconnectGmailController: respond,
    generateEmailContentController: respond,
    previewUnsubscribeController: respond,
    confirmUnsubscribeController: respond,
    listConnectionsController: respond,
    createConnectionController: respond,
    updateConnectionController: respond,
    deleteConnectionController: respond,
    previewConnectionFieldsController: respond,
    listApiKeysController: respond,
    createApiKeyController: respond,
    revokeApiKeyController: respond,
    startImportJobController: respond,
    listImportJobsController: respond,
    getImportJobController: respond,
    listImportRecordsController: respond,
    updateImportJobController: respond,
    commitImportJobController: respond,
    cancelImportJobController: respond,
    ingestWebhookController: respond,
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
vi.mock("@/controllers/sequences.controller.js", () => ({
  listSequencesController: controller.listSequencesController,
  createSequenceController: controller.createSequenceController,
  getSequenceController: controller.getSequenceController,
  updateSequenceController: controller.updateSequenceController,
  updateSequenceStepController: controller.updateSequenceStepController,
  publishSequenceController: controller.publishSequenceController,
  archiveSequenceController: controller.archiveSequenceController,
  deleteSequenceController: controller.deleteSequenceController,
  enrollPeopleController: controller.enrollPeopleController,
  listSequenceEnrollmentsController: controller.listSequenceEnrollmentsController,
  listSequenceActivityController: controller.listSequenceActivityController,
  pauseEnrollmentController: controller.pauseEnrollmentController,
  resumeEnrollmentController: controller.resumeEnrollmentController,
  completeSequenceTaskController: controller.completeSequenceTaskController,
  getSequenceDashboardController: controller.getSequenceDashboardController,
  listGmailIntegrationsController: controller.listGmailIntegrationsController,
  connectGmailController: controller.connectGmailController,
  disconnectGmailController: controller.disconnectGmailController,
  generateEmailContentController: controller.generateEmailContentController,
  previewUnsubscribeController: controller.previewUnsubscribeController,
  confirmUnsubscribeController: controller.confirmUnsubscribeController,
}));
vi.mock("@/controllers/imports.controller.js", () => ({
  listConnectionsController: controller.listConnectionsController,
  createConnectionController: controller.createConnectionController,
  updateConnectionController: controller.updateConnectionController,
  deleteConnectionController: controller.deleteConnectionController,
  previewConnectionFieldsController: controller.previewConnectionFieldsController,
  listApiKeysController: controller.listApiKeysController,
  createApiKeyController: controller.createApiKeyController,
  revokeApiKeyController: controller.revokeApiKeyController,
  startImportJobController: controller.startImportJobController,
  listImportJobsController: controller.listImportJobsController,
  getImportJobController: controller.getImportJobController,
  listImportRecordsController: controller.listImportRecordsController,
  updateImportJobController: controller.updateImportJobController,
  commitImportJobController: controller.commitImportJobController,
  cancelImportJobController: controller.cancelImportJobController,
  ingestWebhookController: controller.ingestWebhookController,
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
import { sequenceRoutes } from "@/routes/sequences.route.js";
import { sequenceUnsubscribeRoutes } from "@/routes/sequence-unsubscribe.route.js";
import { importRoutes } from "@/routes/imports.route.js";
import { importWebhookRoutes } from "@/routes/import-webhook.route.js";
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
    [sequenceRoutes, "/dashboard", "GET"],
    [sequenceRoutes, "/gmail", "GET"],
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

  it("dispatches every sequence management route with validated values", async () => {
    const id = faker.string.uuid();
    const stepId = faker.string.uuid();
    const enrollmentId = faker.string.uuid();
    const taskId = faker.string.uuid();
    const gmailIntegrationId = faker.string.uuid();
    const token = "a".repeat(32);
    const step = {
      type: "email",
      name: "Intro",
      position: 0,
      config: { subject: "Hello", body: "Hi there" },
    };
    const cases: Array<[string, RequestInit | undefined]> = [
      ["/", undefined],
      ["/", jsonRequest("POST", { name: "Outbound" })],
      ["/generate-email", jsonRequest("POST", { prompt: "Write an intro" })],
      [
        "/gmail",
        jsonRequest("POST", {
          email: "sender@example.test",
          grantedScopes: [
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.metadata",
          ],
          accessToken: "access",
          refreshToken: "refresh",
        }),
      ],
      [`/gmail/${gmailIntegrationId}`, { method: "DELETE" }],
      [`/enrollments/${enrollmentId}/pause`, { method: "PATCH" }],
      [`/enrollments/${enrollmentId}/resume`, { method: "PATCH" }],
      [`/tasks/${taskId}/complete`, { method: "PATCH" }],
      [`/${id}`, undefined],
      [`/${id}`, jsonRequest("PATCH", { name: "Outbound 2", steps: [step] })],
      [`/${id}/steps/${stepId}`, jsonRequest("PATCH", { config: { subject: "New" } })],
      [`/${id}/publish`, { method: "POST" }],
      [`/${id}/archive`, { method: "POST" }],
      [`/${id}/enrollments`, jsonRequest("POST", { personIds: [id], gmailIntegrationId })],
      [`/${id}/enrollments`, undefined],
      [`/${id}/activity`, undefined],
      [`/${id}`, { method: "DELETE" }],
    ];

    for (const [path, init] of cases) {
      expect((await sequenceRoutes.request(path, init)).status).toBe(200);
    }

    expect((await sequenceUnsubscribeRoutes.request(`/${token}`)).status).toBe(200);
    expect((await sequenceUnsubscribeRoutes.request(`/${token}`, { method: "POST" })).status).toBe(
      200,
    );
  });

  it("dispatches every import route with validated values", async () => {
    const id = faker.string.uuid();
    const cases: Array<[string, RequestInit | undefined]> = [
      ["/connections", undefined],
      [
        "/connections",
        jsonRequest("POST", {
          provider: "posthog",
          displayName: "PostHog",
          accessToken: "phx_test",
        }),
      ],
      [`/connections/${id}/fields`, undefined],
      [`/connections/${id}`, jsonRequest("PATCH", { displayName: "Renamed" })],
      [`/connections/${id}`, { method: "DELETE" }],
      ["/api-keys", undefined],
      ["/api-keys", jsonRequest("POST", { name: "Zapier" })],
      [`/api-keys/${id}`, { method: "DELETE" }],
      ["/jobs", undefined],
      ["/jobs", jsonRequest("POST", { provider: "csv", csvContent: "Name\nDana\n" })],
      [`/jobs/${id}`, undefined],
      [`/jobs/${id}/records`, undefined],
      [`/jobs/${id}`, jsonRequest("PATCH", { mapping: { fields: [] } })],
      [`/jobs/${id}/commit`, { method: "POST" }],
      [`/jobs/${id}/cancel`, { method: "POST" }],
    ];

    for (const [path, init] of cases) {
      expect((await importRoutes.request(path, init)).status).toBe(200);
    }
  });

  it("accepts an inbound webhook push outside the session middleware", async () => {
    const response = await importWebhookRoutes.request(
      "/",
      jsonRequest("POST", { records: [{ email: "dana@northwind.example", name: "Dana" }] }),
    );

    expect(response.status).toBe(200);
  });

  it("registers the complete API and constructs the server export", async () => {
    const app = new Hono();
    registerRoutes(app);

    expect((await app.request("/health")).status).toBe(200);
    expect((await app.request("/sequences")).status).toBe(200);
    expect((await app.request(`/sequence-unsubscribe/${"a".repeat(32)}`)).status).toBe(200);
    expect(server.port).toBe(3001);
    expect(server.fetch).toEqual(expect.any(Function));
    expect((await healthRoutes.request("/")).status).toBe(200);
  });
});

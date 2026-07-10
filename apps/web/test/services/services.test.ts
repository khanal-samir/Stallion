import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    api: { get: fn(), post: fn(), patch: fn(), delete: fn() },
    auth: {
      getSession: fn(),
      signIn: { email: fn() },
      signUp: { email: fn() },
      signOut: fn(),
      requestPasswordReset: fn(),
      resetPassword: fn(),
      verifyEmail: fn(),
      organization: {
        create: fn(),
        list: fn(),
        getFullOrganization: fn(),
        listMembers: fn(),
        listInvitations: fn(),
        update: fn(),
        delete: fn(),
        setActive: fn(),
        removeMember: fn(),
        updateMemberRole: fn(),
        leave: fn(),
        inviteMember: fn(),
        cancelInvitation: fn(),
        getInvitation: fn(),
        acceptInvitation: fn(),
        rejectInvitation: fn(),
      },
    },
  };
});

vi.mock("@/lib/axios-client", () => ({ apiClient: mocks.api }));
vi.mock("@/lib/auth-client", () => ({ authClient: mocks.auth }));

import * as authService from "@/services/auth.service";
import * as onboardingService from "@/services/onboarding.service";
import * as workspaceService from "@/services/workspace.service";
import * as analyticsService from "@/services/crm/analytics.service";
import * as customFieldsService from "@/services/crm/custom-fields.service";
import * as dealsService from "@/services/crm/deals.service";
import * as orgService from "@/services/crm/org.service";
import * as peopleService from "@/services/crm/people.service";
import * as sequencesService from "@/services/sequences.service";

const success = (data: unknown = { id: "result" }) => ({ data, error: null });
const failure = { data: null, error: { code: "FAILED", message: "failed", status: 400 } };

describe("web service contracts", () => {
  beforeEach(() => {
    faker.seed(20260706);
    const envelope = {
      data: {
        data: {
          id: "result",
          customField: { id: "field" },
          customFields: [{ id: "field" }],
          deal: { id: "deal" },
          deals: [],
          org: { id: "org" },
          people: [],
          person: { id: "person" },
          sequence: { id: "sequence" },
          sequences: [],
          version: { id: "version" },
          enrollments: [],
          activity: [],
          gmailIntegrations: [],
          gmailIntegration: { id: "gmail" },
          task: { id: "task" },
          email: { subject: "Subject", body: "Body" },
          counters: {
            activeEnrollments: 1,
            emailsSentToday: 1,
            repliesDetected: 0,
            failedSteps: 0,
          },
          dueTasks: [],
          gmailWarnings: [],
          recentActivity: [],
          alreadyUnsubscribed: false,
          pipeline: [],
          peopleStatus: [],
          won: 1,
          lost: 1,
          total: 2,
          rate: 50,
          deleted: 2,
          crmTourCompleted: true,
          crmTourCompletedAt: null,
        },
      },
    };
    Object.values(mocks.api).forEach((method) => method.mockResolvedValue(envelope));
    const authMethods = [
      mocks.auth.getSession,
      mocks.auth.signIn.email,
      mocks.auth.signUp.email,
      mocks.auth.signOut,
      mocks.auth.requestPasswordReset,
      mocks.auth.resetPassword,
      mocks.auth.verifyEmail,
      ...Object.values(mocks.auth.organization),
    ];
    authMethods.forEach((method) => method.mockResolvedValue(success()));
  });

  it("maps all HTTP CRM and onboarding endpoints", async () => {
    const id = faker.string.uuid();
    await onboardingService.getOnboardingStatus();
    await onboardingService.completeCrmTour();
    await analyticsService.getPipelineByStage();
    await analyticsService.getPeopleByStatus();
    await analyticsService.getWinRate();
    await customFieldsService.listPeopleCustomFields();
    await customFieldsService.listOrgCustomFields();
    await customFieldsService.createPeopleCustomField({ label: "Region", type: "text" });
    await customFieldsService.createOrgCustomField({ label: "Region", type: "text" });
    await customFieldsService.updatePeopleCustomField(id, { label: "Area" });
    await customFieldsService.updateOrgCustomField(id, { label: "Area" });
    await customFieldsService.deletePeopleCustomField(id);
    await customFieldsService.deleteOrgCustomField(id);
    await dealsService.listDeals();
    await dealsService.listDeals({ page: 2 });
    await dealsService.getDeal(id);
    await dealsService.createDeal({ title: "Deal" });
    await dealsService.updateDeal(id, { stage: "won" });
    await dealsService.deleteDeal(id);
    await orgService.listOrganizations();
    await orgService.listOrganizations({ search: "acme" });
    await orgService.getOrganization(id);
    await orgService.createOrganization({ name: "Acme" });
    await orgService.updateOrganization(id, { name: "Acme 2" });
    await orgService.deleteOrganization(id);
    await orgService.bulkDeleteOrganizations({ ids: [id] });
    await peopleService.listPeople();
    await peopleService.listPeople({ status: "lead" });
    await peopleService.getPerson(id);
    await peopleService.createPerson({ name: "Ada" });
    await peopleService.updatePerson(id, { status: "customer" });
    await peopleService.deletePerson(id);
    await peopleService.bulkDeletePeople({ ids: [id] });
    await sequencesService.listSequences();
    await sequencesService.listSequences({ status: "published" });
    await sequencesService.createSequence({ name: "Outbound" });
    await sequencesService.getSequence(id);
    await sequencesService.updateSequence(id, {
      name: "Outbound 2",
      steps: [
        {
          type: "email",
          name: "Intro",
          position: 0,
          config: { subject: "Hello", body: "Hi" },
        },
      ],
    });
    await sequencesService.updateSequenceStep(id, id, { config: { subject: "New" } });
    await sequencesService.publishSequence(id);
    await sequencesService.archiveSequence(id);
    await sequencesService.deleteSequence(id);
    await sequencesService.enrollPeople(id, { personIds: [id], gmailIntegrationId: id });
    await sequencesService.listSequenceEnrollments(id);
    await sequencesService.listSequenceEnrollments(id, { status: "active" });
    await sequencesService.listSequenceActivity(id);
    await sequencesService.pauseEnrollment(id);
    await sequencesService.resumeEnrollment(id);
    await sequencesService.completeSequenceTask(id);
    await sequencesService.getSequenceDashboard();
    await sequencesService.listGmailIntegrations();
    await sequencesService.connectGmail({
      email: "sender@example.test",
      grantedScopes: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.metadata",
      ],
      accessToken: "access",
      refreshToken: "refresh",
    });
    await sequencesService.disconnectGmail(id);
    await sequencesService.generateEmailContent("Write an intro");
    await sequencesService.previewUnsubscribe("a".repeat(32));
    await sequencesService.confirmUnsubscribe("a".repeat(32));

    expect(mocks.api.get).toHaveBeenCalled();
    expect(mocks.api.post).toHaveBeenCalled();
    expect(mocks.api.patch).toHaveBeenCalled();
    expect(mocks.api.delete).toHaveBeenCalled();
  });

  it("maps successful authentication operations", async () => {
    const credentials = { email: faker.internet.email(), password: "secret1" };
    await expect(authService.getAuthSession()).resolves.toEqual({ id: "result" });
    await authService.signInWithEmail(credentials);
    await authService.signUpWithEmail({ ...credentials, name: faker.person.fullName() });
    await authService.signOutCurrentSession();
    await authService.requestPasswordResetLink({ email: credentials.email });
    await authService.resetPasswordWithToken({ password: "secret2", token: "token" });
    await authService.verifyEmailToken("token");

    expect(mocks.auth.signIn.email).toHaveBeenCalledWith({ ...credentials, rememberMe: true });
  });

  it("treats missing and unauthorized sessions as signed out", async () => {
    mocks.auth.getSession
      .mockResolvedValueOnce({ data: undefined, error: null })
      .mockResolvedValueOnce({ data: null, error: { status: 401 } });

    await expect(authService.getAuthSession()).resolves.toBeNull();
    await expect(authService.getAuthSession()).resolves.toBeNull();
  });

  it("surfaces every authentication operation failure", async () => {
    const calls = [
      [mocks.auth.getSession, () => authService.getAuthSession()],
      [
        mocks.auth.signIn.email,
        () => authService.signInWithEmail({ email: "a@b.co", password: "x" }),
      ],
      [
        mocks.auth.signUp.email,
        () => authService.signUpWithEmail({ name: "A", email: "a@b.co", password: "x" }),
      ],
      [mocks.auth.signOut, () => authService.signOutCurrentSession()],
      [
        mocks.auth.requestPasswordReset,
        () => authService.requestPasswordResetLink({ email: "a@b.co" }),
      ],
      [
        mocks.auth.resetPassword,
        () => authService.resetPasswordWithToken({ password: "x", token: "token" }),
      ],
      [mocks.auth.verifyEmail, () => authService.verifyEmailToken("token")],
    ] as const;

    for (const [method, call] of calls) {
      method.mockResolvedValueOnce(failure);
      await expect(call()).rejects.toMatchObject({ message: "failed" });
    }
  });

  it("maps workspace operations and response variants", async () => {
    const id = faker.string.uuid();
    await workspaceService.createWorkspace({ name: "Sales" });
    await workspaceService.createWorkspace({
      name: "Sales",
      slug: "sales",
      logo: "logo",
      metadata: { tier: "pro" },
    });
    await workspaceService.listWorkspaces();
    await workspaceService.getFullWorkspace();
    await workspaceService.getFullWorkspace({ organizationId: id });

    mocks.auth.organization.listMembers
      .mockResolvedValueOnce(success([{ id: "member" }]))
      .mockResolvedValueOnce(success({ members: [{ id: "member" }] }))
      .mockResolvedValueOnce(success(null));
    await workspaceService.listWorkspaceMembers();
    await workspaceService.listWorkspaceMembers({ organizationId: id });
    await workspaceService.listWorkspaceMembers();

    mocks.auth.organization.listInvitations
      .mockResolvedValueOnce(success([{ id: "invite" }]))
      .mockResolvedValueOnce(success({ invitations: [{ id: "invite" }] }))
      .mockResolvedValueOnce(success(null));
    await workspaceService.listWorkspaceInvitations();
    await workspaceService.listWorkspaceInvitations({ organizationId: id });
    await workspaceService.listWorkspaceInvitations();

    await workspaceService.updateWorkspace(id, { name: "New" });
    await workspaceService.deleteWorkspace(id);
    await workspaceService.setActiveWorkspace();
    await workspaceService.setActiveWorkspace({ organizationId: id });
    await workspaceService.removeMember("member");
    await workspaceService.removeMember("member", id);
    await workspaceService.updateMemberRole("member", "admin");
    await workspaceService.updateMemberRole("member", "admin", id);
    await workspaceService.leaveWorkspace(id);
    await workspaceService.inviteMember({ email: "a@b.co", role: "member" });
    await workspaceService.inviteMember({
      email: "a@b.co",
      role: "member",
      organizationId: id,
      resend: true,
    });
    await workspaceService.cancelInvitation(id);
    await workspaceService.getInvitation(id);
    await workspaceService.acceptInvitation(id);
    await workspaceService.rejectInvitation(id);

    expect(mocks.auth.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "sales" }),
    );
  });

  it("surfaces every workspace operation failure", async () => {
    const id = faker.string.uuid();
    const calls = [
      [mocks.auth.organization.create, () => workspaceService.createWorkspace({ name: "Sales" })],
      [mocks.auth.organization.list, () => workspaceService.listWorkspaces()],
      [mocks.auth.organization.getFullOrganization, () => workspaceService.getFullWorkspace()],
      [mocks.auth.organization.listMembers, () => workspaceService.listWorkspaceMembers()],
      [mocks.auth.organization.listInvitations, () => workspaceService.listWorkspaceInvitations()],
      [mocks.auth.organization.update, () => workspaceService.updateWorkspace(id, {})],
      [mocks.auth.organization.delete, () => workspaceService.deleteWorkspace(id)],
      [mocks.auth.organization.setActive, () => workspaceService.setActiveWorkspace()],
      [mocks.auth.organization.removeMember, () => workspaceService.removeMember("member")],
      [
        mocks.auth.organization.updateMemberRole,
        () => workspaceService.updateMemberRole("member", "admin"),
      ],
      [mocks.auth.organization.leave, () => workspaceService.leaveWorkspace(id)],
      [
        mocks.auth.organization.inviteMember,
        () => workspaceService.inviteMember({ email: "a@b.co", role: "member" }),
      ],
      [mocks.auth.organization.cancelInvitation, () => workspaceService.cancelInvitation(id)],
      [mocks.auth.organization.getInvitation, () => workspaceService.getInvitation(id)],
      [mocks.auth.organization.acceptInvitation, () => workspaceService.acceptInvitation(id)],
      [mocks.auth.organization.rejectInvitation, () => workspaceService.rejectInvitation(id)],
    ] as const;

    for (const [method, call] of calls) {
      method.mockResolvedValueOnce(failure);
      await expect(call()).rejects.toMatchObject({ message: "failed" });
    }
  });
});

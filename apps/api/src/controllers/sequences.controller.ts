import type { Context } from "hono";
import type {
  ConnectGmailInput,
  CreateSequenceInput,
  EnrollPeopleInput,
  GenerateEmailContentInput,
  ListEnrollmentsQuery,
  ListSequencesQuery,
  UpdateSequenceInput,
  UpdateSequenceStepInput,
} from "@workspace/validators/schemas/sequence";
import { STATUS_CODES } from "@/constants/status-codes.js";
import { sendSuccess } from "@/lib/api-response.js";
import { getSessionWorkspaceId } from "@/lib/workspace.js";
import {
  archiveSequence,
  completeSequenceTask,
  confirmUnsubscribe,
  connectGmail,
  createSequence,
  deleteSequence,
  disconnectGmail,
  enrollPeople,
  generateSequenceEmailContent,
  getSequence,
  getSequenceDashboard,
  listGmailIntegrations,
  listSequenceActivity,
  listSequenceEnrollments,
  listSequences,
  pauseEnrollment,
  previewUnsubscribe,
  publishSequence,
  resumeEnrollment,
  updateSequence,
  updateSequenceStep,
} from "@/services/sequence.service.js";

export async function listSequencesController(c: Context, query: ListSequencesQuery) {
  return sendSuccess(c, await listSequences(getSessionWorkspaceId(c), query), STATUS_CODES.OK);
}

export async function createSequenceController(c: Context, input: CreateSequenceInput) {
  const workspaceId = getSessionWorkspaceId(c);
  const user = c.get("user");
  return sendSuccess(c, { sequence: await createSequence(workspaceId, user.id, input) }, STATUS_CODES.CREATED);
}

export async function getSequenceController(c: Context, sequenceId: string) {
  return sendSuccess(c, await getSequence(getSessionWorkspaceId(c), sequenceId), STATUS_CODES.OK);
}

export async function updateSequenceController(
  c: Context,
  sequenceId: string,
  input: UpdateSequenceInput,
) {
  return sendSuccess(
    c,
    await updateSequence(getSessionWorkspaceId(c), sequenceId, input),
    STATUS_CODES.OK,
  );
}

export async function updateSequenceStepController(
  c: Context,
  sequenceId: string,
  stepId: string,
  input: UpdateSequenceStepInput,
) {
  return sendSuccess(
    c,
    { step: await updateSequenceStep(getSessionWorkspaceId(c), sequenceId, stepId, input) },
    STATUS_CODES.OK,
  );
}

export async function publishSequenceController(c: Context, sequenceId: string) {
  const workspaceId = getSessionWorkspaceId(c);
  const user = c.get("user");
  return sendSuccess(
    c,
    { version: await publishSequence(workspaceId, sequenceId, user.id) },
    STATUS_CODES.OK,
  );
}

export async function archiveSequenceController(c: Context, sequenceId: string) {
  return sendSuccess(
    c,
    { sequence: await archiveSequence(getSessionWorkspaceId(c), sequenceId) },
    STATUS_CODES.OK,
  );
}

export async function deleteSequenceController(c: Context, sequenceId: string) {
  return sendSuccess(
    c,
    { sequence: await deleteSequence(getSessionWorkspaceId(c), sequenceId) },
    STATUS_CODES.OK,
  );
}

export async function enrollPeopleController(
  c: Context,
  sequenceId: string,
  input: EnrollPeopleInput,
) {
  const workspaceId = getSessionWorkspaceId(c);
  const user = c.get("user");
  return sendSuccess(
    c,
    { enrollments: await enrollPeople(workspaceId, sequenceId, user.id, input) },
    STATUS_CODES.CREATED,
  );
}

export async function listSequenceEnrollmentsController(
  c: Context,
  sequenceId: string,
  query: ListEnrollmentsQuery,
) {
  return sendSuccess(
    c,
    { enrollments: await listSequenceEnrollments(getSessionWorkspaceId(c), sequenceId, query) },
    STATUS_CODES.OK,
  );
}

export async function listSequenceActivityController(c: Context, sequenceId: string) {
  return sendSuccess(
    c,
    { activity: await listSequenceActivity(getSessionWorkspaceId(c), sequenceId) },
    STATUS_CODES.OK,
  );
}

export async function pauseEnrollmentController(c: Context, enrollmentId: string) {
  return sendSuccess(
    c,
    { enrollment: await pauseEnrollment(getSessionWorkspaceId(c), enrollmentId) },
    STATUS_CODES.OK,
  );
}

export async function resumeEnrollmentController(c: Context, enrollmentId: string) {
  return sendSuccess(
    c,
    { enrollment: await resumeEnrollment(getSessionWorkspaceId(c), enrollmentId) },
    STATUS_CODES.OK,
  );
}

export async function completeSequenceTaskController(c: Context, taskId: string) {
  return sendSuccess(
    c,
    { task: await completeSequenceTask(getSessionWorkspaceId(c), taskId) },
    STATUS_CODES.OK,
  );
}

export async function getSequenceDashboardController(c: Context) {
  return sendSuccess(c, await getSequenceDashboard(getSessionWorkspaceId(c)), STATUS_CODES.OK);
}

export async function listGmailIntegrationsController(c: Context) {
  const user = c.get("user");
  return sendSuccess(
    c,
    { gmailIntegrations: await listGmailIntegrations(getSessionWorkspaceId(c), user.id) },
    STATUS_CODES.OK,
  );
}

export async function connectGmailController(c: Context, input: ConnectGmailInput) {
  const user = c.get("user");
  return sendSuccess(
    c,
    { gmailIntegration: await connectGmail(getSessionWorkspaceId(c), user.id, input) },
    STATUS_CODES.CREATED,
  );
}

export async function disconnectGmailController(c: Context, gmailIntegrationId: string) {
  const user = c.get("user");
  return sendSuccess(
    c,
    {
      gmailIntegration: await disconnectGmail(
        getSessionWorkspaceId(c),
        user.id,
        gmailIntegrationId,
      ),
    },
    STATUS_CODES.OK,
  );
}

export async function generateEmailContentController(c: Context, input: GenerateEmailContentInput) {
  return sendSuccess(
    c,
    { email: await generateSequenceEmailContent(input.prompt) },
    STATUS_CODES.OK,
  );
}

export async function previewUnsubscribeController(c: Context, token: string) {
  return sendSuccess(c, await previewUnsubscribe(token), STATUS_CODES.OK);
}

export async function confirmUnsubscribeController(c: Context, token: string) {
  return sendSuccess(c, await confirmUnsubscribe(token), STATUS_CODES.OK);
}

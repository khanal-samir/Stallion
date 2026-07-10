import { apiClient } from "@/lib/axios-client";
import type { ApiSuccessResponse } from "@workspace/validators/types/auth";
import type { ListEnrollmentsQuery } from "@workspace/validators/schemas/sequence";
import type {
  ConnectGmailPayload,
  CreateSequencePayload,
  EnrollPeoplePayload,
  GmailIntegration,
  Sequence,
  SequenceActivityEvent,
  SequenceDashboardResponse,
  SequenceDetailResponse,
  SequenceEnrollment,
  SequenceListParams,
  SequencesListResponse,
  SequenceTask,
  SequenceVersion,
  UnsubscribePreview,
  UpdateSequencePayload,
  UpdateSequenceStepPayload,
} from "@/types/sequence";
import { cleanQueryParams } from "./crm/utils";

type SequenceResponse = ApiSuccessResponse<{ sequence: Sequence }>;
type SequencesResponse = ApiSuccessResponse<SequencesListResponse>;
type SequenceDetailApiResponse = ApiSuccessResponse<SequenceDetailResponse>;
type SequenceVersionResponse = ApiSuccessResponse<{ version: SequenceVersion }>;
type SequenceEnrollmentsResponse = ApiSuccessResponse<{ enrollments: SequenceEnrollment[] }>;
type SequenceEnrollmentResponse = ApiSuccessResponse<{ enrollment: SequenceEnrollment }>;
type SequenceActivityResponse = ApiSuccessResponse<{ activity: SequenceActivityEvent[] }>;
type SequenceDashboardApiResponse = ApiSuccessResponse<SequenceDashboardResponse>;
type GmailIntegrationsResponse = ApiSuccessResponse<{ gmailIntegrations: GmailIntegration[] }>;
type GmailIntegrationResponse = ApiSuccessResponse<{ gmailIntegration: GmailIntegration }>;
type SequenceTaskResponse = ApiSuccessResponse<{ task: SequenceTask }>;
type GeneratedEmailResponse = ApiSuccessResponse<{ email: { subject: string; body: string } }>;
type UnsubscribePreviewResponse = ApiSuccessResponse<UnsubscribePreview>;

export async function listSequences(params: SequenceListParams = {}) {
  const response = await apiClient.get<SequencesResponse>("/sequences", {
    params: cleanQueryParams(params),
  });
  return response.data.data;
}

export async function createSequence(input: CreateSequencePayload) {
  const response = await apiClient.post<SequenceResponse>("/sequences", input);
  return response.data.data.sequence;
}

export async function getSequence(id: string) {
  const response = await apiClient.get<SequenceDetailApiResponse>(`/sequences/${id}`);
  return response.data.data;
}

export async function updateSequence(id: string, input: UpdateSequencePayload) {
  const response = await apiClient.patch<SequenceDetailApiResponse>(`/sequences/${id}`, input);
  return response.data.data;
}

export async function updateSequenceStep(
  sequenceId: string,
  stepId: string,
  input: UpdateSequenceStepPayload,
) {
  const response = await apiClient.patch<ApiSuccessResponse<{ step: unknown }>>(
    `/sequences/${sequenceId}/steps/${stepId}`,
    input,
  );
  return response.data.data.step;
}

export async function publishSequence(id: string) {
  const response = await apiClient.post<SequenceVersionResponse>(`/sequences/${id}/publish`);
  return response.data.data.version;
}

export async function archiveSequence(id: string) {
  const response = await apiClient.post<SequenceResponse>(`/sequences/${id}/archive`);
  return response.data.data.sequence;
}

export async function deleteSequence(id: string) {
  const response = await apiClient.delete<SequenceResponse>(`/sequences/${id}`);
  return response.data.data.sequence;
}

export async function enrollPeople(sequenceId: string, input: EnrollPeoplePayload) {
  const response = await apiClient.post<SequenceEnrollmentsResponse>(
    `/sequences/${sequenceId}/enrollments`,
    input,
  );
  return response.data.data.enrollments;
}

export async function listSequenceEnrollments(sequenceId: string, params: Partial<ListEnrollmentsQuery> = {}) {
  const response = await apiClient.get<SequenceEnrollmentsResponse>(
    `/sequences/${sequenceId}/enrollments`,
    { params: cleanQueryParams(params) },
  );
  return response.data.data.enrollments;
}

export async function listSequenceActivity(sequenceId: string) {
  const response = await apiClient.get<SequenceActivityResponse>(`/sequences/${sequenceId}/activity`);
  return response.data.data.activity;
}

export async function pauseEnrollment(enrollmentId: string) {
  const response = await apiClient.patch<SequenceEnrollmentResponse>(
    `/sequences/enrollments/${enrollmentId}/pause`,
  );
  return response.data.data.enrollment;
}

export async function resumeEnrollment(enrollmentId: string) {
  const response = await apiClient.patch<SequenceEnrollmentResponse>(
    `/sequences/enrollments/${enrollmentId}/resume`,
  );
  return response.data.data.enrollment;
}

export async function completeSequenceTask(taskId: string) {
  const response = await apiClient.patch<SequenceTaskResponse>(`/sequences/tasks/${taskId}/complete`);
  return response.data.data.task;
}

export async function getSequenceDashboard() {
  const response = await apiClient.get<SequenceDashboardApiResponse>("/sequences/dashboard");
  return response.data.data;
}

export async function listGmailIntegrations() {
  const response = await apiClient.get<GmailIntegrationsResponse>("/sequences/gmail");
  return response.data.data.gmailIntegrations;
}

export async function connectGmail(input: ConnectGmailPayload) {
  const response = await apiClient.post<GmailIntegrationResponse>("/sequences/gmail", input);
  return response.data.data.gmailIntegration;
}

export async function disconnectGmail(gmailIntegrationId: string) {
  const response = await apiClient.delete<GmailIntegrationResponse>(
    `/sequences/gmail/${gmailIntegrationId}`,
  );
  return response.data.data.gmailIntegration;
}

export async function generateEmailContent(prompt: string) {
  const response = await apiClient.post<GeneratedEmailResponse>("/sequences/generate-email", {
    prompt,
  });
  return response.data.data.email;
}

export async function previewUnsubscribe(token: string) {
  const response = await apiClient.get<UnsubscribePreviewResponse>(
    `/sequence-unsubscribe/${encodeURIComponent(token)}`,
  );
  return response.data.data;
}

export async function confirmUnsubscribe(token: string) {
  const response = await apiClient.post<UnsubscribePreviewResponse>(
    `/sequence-unsubscribe/${encodeURIComponent(token)}`,
  );
  return response.data.data;
}

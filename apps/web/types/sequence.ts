import type {
  ConnectGmailInput,
  CreateSequenceInput,
  EnrollPeopleInput,
  ListSequencesQuery,
  SequenceActivityType,
  SequenceDraftStepInput,
  SequenceEnrollmentStatus,
  SequenceSendingWindow,
  SequenceStatus,
  SequenceStepType,
  SequenceTaskStatus,
  SequenceTaskType,
  UpdateSequenceInput,
  UpdateSequenceStepInput,
} from "@workspace/validators/schemas/sequence";
import type { PaginationMeta, Person } from "./crm";

export interface SequenceStep {
  id: string;
  workspaceId: string;
  sequenceId: string;
  type: SequenceStepType;
  name: string;
  position: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Sequence {
  id: string;
  workspaceId: string;
  createdById: string | null;
  latestPublishedVersionId: string | null;
  name: string;
  status: SequenceStatus;
  timezone: string;
  sendingWindow: SequenceSendingWindow;
  createdAt: string;
  updatedAt: string;
  steps?: SequenceStep[];
  metrics?: {
    enrollments: number;
    sent: number;
    replies: number;
    failures: number;
  };
}

export interface SequenceVersion {
  id: string;
  workspaceId: string;
  sequenceId: string;
  versionNumber: number;
  name: string;
  stepsSnapshot: SequenceDraftStepInput[];
  publishedById: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GmailIntegration {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  status: "connected" | "reconnect_required" | "disconnected";
  grantedScopes: string[];
  tokenExpiresAt: string | null;
  lastSyncAt: string | null;
  timezone: string;
  sendingWindow: SequenceSendingWindow;
  dailyLimit: number;
  hourlyLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceEnrollment {
  id: string;
  workspaceId: string;
  sequenceId: string;
  versionId: string;
  personId: string;
  gmailIntegrationId: string | null;
  enrolledById: string | null;
  status: SequenceEnrollmentStatus;
  currentPosition: number;
  nextStepDueAt: string | null;
  lastError: string | null;
  pausedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  person?: Pick<Person, "id" | "name" | "email" | "linkedinUrl"> | null;
  gmailIntegration?: Pick<GmailIntegration, "id" | "email" | "status"> | null;
}

export interface SequenceTask {
  id: string;
  workspaceId: string;
  sequenceId: string | null;
  enrollmentId: string | null;
  enrollmentStepId: string | null;
  personId: string | null;
  assignedToId: string | null;
  type: SequenceTaskType;
  status: SequenceTaskStatus;
  title: string;
  body: string;
  dueAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  person?: Pick<Person, "id" | "name" | "email"> | null;
}

export interface SequenceActivityEvent {
  id: string;
  workspaceId: string;
  sequenceId: string | null;
  enrollmentId: string | null;
  personId: string | null;
  type: SequenceActivityType;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SequencesListResponse {
  sequences: Sequence[];
  meta: PaginationMeta;
}

export interface SequenceDetailResponse {
  sequence: Sequence;
  counts: {
    enrollments: number;
    activity: number;
  };
}

export interface SequenceDashboardResponse {
  counters: {
    activeEnrollments: number;
    emailsSentToday: number;
    repliesDetected: number;
    failedSteps: number;
  };
  dueTasks: SequenceTask[];
  gmailWarnings: Pick<GmailIntegration, "id" | "email" | "status" | "updatedAt">[];
  recentActivity: SequenceActivityEvent[];
}

export interface UnsubscribePreview {
  email: string;
  sequence: Pick<Sequence, "id" | "name">;
  alreadyUnsubscribed: boolean;
}

export type SequenceListParams = Partial<ListSequencesQuery>;
export type CreateSequencePayload = Omit<CreateSequenceInput, "timezone"> &
  Partial<Pick<CreateSequenceInput, "timezone" | "sendingWindow">>;
export type UpdateSequencePayload = UpdateSequenceInput;
export type UpdateSequenceStepPayload = UpdateSequenceStepInput;
export type EnrollPeoplePayload = EnrollPeopleInput;
export type ConnectGmailPayload = Omit<
  ConnectGmailInput,
  "dailyLimit" | "hourlyLimit" | "timezone"
> &
  Partial<Pick<ConnectGmailInput, "dailyLimit" | "hourlyLimit" | "timezone" | "sendingWindow">>;

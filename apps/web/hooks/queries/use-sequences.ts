import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import { useAuthSession } from "@/hooks/queries/use-auth";
import {
  archiveSequence,
  completeSequenceTask,
  connectGmail,
  createSequence,
  deleteSequence,
  disconnectGmail,
  enrollPeople,
  generateEmailContent,
  getSequence,
  getSequenceDashboard,
  listGmailIntegrations,
  listSequenceActivity,
  listSequenceEnrollments,
  listSequences,
  pauseEnrollment,
  publishSequence,
  resumeEnrollment,
  updateSequence,
} from "@/services/sequences.service";
import type {
  ConnectGmailPayload,
  CreateSequencePayload,
  EnrollPeoplePayload,
  SequenceListParams,
  UpdateSequencePayload,
} from "@/types/sequence";

export function useSequences(params: SequenceListParams = {}) {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.SEQUENCES, QUERY_KEYS.SEQUENCES_LIST, params],
    queryFn: () => listSequences(params),
    enabled: !!session?.user,
    placeholderData: (previousData) => previousData,
  });
}

export function useSequence(sequenceId?: string | null) {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.SEQUENCES, QUERY_KEYS.SEQUENCE_DETAIL, sequenceId ?? ""],
    queryFn: () => getSequence(sequenceId!),
    enabled: !!session?.user && !!sequenceId,
  });
}

export function useSequenceEnrollments(sequenceId?: string | null) {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.SEQUENCES, QUERY_KEYS.SEQUENCE_ENROLLMENTS, sequenceId ?? ""],
    queryFn: () => listSequenceEnrollments(sequenceId!),
    enabled: !!session?.user && !!sequenceId,
  });
}

export function useSequenceActivity(sequenceId?: string | null) {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.SEQUENCES, QUERY_KEYS.SEQUENCE_ACTIVITY, sequenceId ?? ""],
    queryFn: () => listSequenceActivity(sequenceId!),
    enabled: !!session?.user && !!sequenceId,
  });
}

export function useSequenceDashboard() {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.SEQUENCES, QUERY_KEYS.SEQUENCE_DASHBOARD],
    queryFn: getSequenceDashboard,
    enabled: !!session?.user,
  });
}

export function useGmailIntegrations() {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.SEQUENCES, QUERY_KEYS.GMAIL_INTEGRATIONS],
    queryFn: listGmailIntegrations,
    enabled: !!session?.user,
  });
}

export function useCreateSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSequencePayload) => createSequence(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEQUENCES] });
      toast.success("Sequence created");
    },
  });
}

export function useUpdateSequence(sequenceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSequencePayload) => updateSequence(sequenceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEQUENCES] });
      toast.success("Draft saved");
    },
  });
}

export function usePublishSequence(sequenceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => publishSequence(sequenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEQUENCES] });
      toast.success("Sequence published");
    },
  });
}

export function useArchiveSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sequenceId: string) => archiveSequence(sequenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEQUENCES] });
      toast.success("Sequence archived");
    },
  });
}

export function useDeleteSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sequenceId: string) => deleteSequence(sequenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEQUENCES] });
      toast.success("Sequence deleted");
    },
  });
}

export function useEnrollPeople(sequenceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EnrollPeoplePayload) => enrollPeople(sequenceId, input),
    onSuccess: (enrollments) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEQUENCES] });
      toast.success("People enrolled", {
        description: `${enrollments.length} enrollment${enrollments.length === 1 ? "" : "s"} started.`,
      });
    },
  });
}

export function usePauseEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEQUENCES] });
      toast.success("Enrollment paused");
    },
  });
}

export function useResumeEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumeEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEQUENCES] });
      toast.success("Enrollment resumed");
    },
  });
}

export function useCompleteSequenceTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeSequenceTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEQUENCES] });
      toast.success("Task completed");
    },
  });
}

export function useConnectGmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ConnectGmailPayload) => connectGmail(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEQUENCES] });
      toast.success("Gmail connected");
    },
  });
}

export function useDisconnectGmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectGmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEQUENCES] });
      toast.success("Gmail disconnected");
    },
  });
}

export function useGenerateEmailContent() {
  return useMutation({
    mutationFn: generateEmailContent,
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptInvitation,
  cancelInvitation,
  createWorkspace,
  deleteWorkspace,
  getFullWorkspace,
  getInvitation,
  inviteMember,
  leaveWorkspace,
  listWorkspaces,
  rejectInvitation,
  removeMember,
  setActiveWorkspace,
  updateMemberRole,
  updateWorkspace,
} from "@/services/workspace.service";
import {
  CreateWorkspace,
  InviteMemberInput,
  UpdateWorkspace,
  WorkspaceRole,
} from "@workspace/validators";
import { QUERY_KEYS } from "@/lib/query-keys";
import { useAuthSession } from "@/hooks/queries/use-auth";
import { sileo } from "sileo";

const workspacesQueryKey = [QUERY_KEYS.WORKSPACES] as const;
const authQueryKey = [QUERY_KEYS.AUTH] as const;

export function useWorkspaces() {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: workspacesQueryKey,
    queryFn: listWorkspaces,
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWorkspace(opts: { organizationId?: string; organizationSlug?: string } = {}) {
  const { data: session } = useAuthSession();
  const key = opts.organizationId ?? opts.organizationSlug ?? "active";

  return useQuery({
    queryKey: [QUERY_KEYS.WORKSPACES, QUERY_KEYS.WORKSPACE, key],
    queryFn: () => getFullWorkspace(opts),
    enabled: !!session?.user,
  });
}

export function useActiveWorkspace() {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.WORKSPACES, QUERY_KEYS.ACTIVE_WORKSPACE],
    queryFn: () => getFullWorkspace(),
    enabled: !!session?.user,
    placeholderData: (prev) => prev,
  });
}

export function useInvitation(invitationId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.WORKSPACES, QUERY_KEYS.WORKSPACE_INVITATION, invitationId ?? ""],
    queryFn: () => getInvitation(invitationId!),
    enabled: !!invitationId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspace) => createWorkspace(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authQueryKey });
      qc.invalidateQueries({ queryKey: workspacesQueryKey });
      sileo.success({ title: "Workspace created", description: "Your new workspace is ready." });
    },
  });
}

export function useUpdateWorkspace(organizationId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWorkspace) => updateWorkspace(organizationId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspacesQueryKey });
      sileo.success({
        title: "Workspace updated",
        description: "Your workspace has been updated.",
      });
    },
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) => deleteWorkspace(organizationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authQueryKey });
      qc.invalidateQueries({ queryKey: workspacesQueryKey });
      sileo.success({
        title: "Workspace deleted",
        description: "The workspace has been deleted.",
      });
    },
  });
}

export function useSetActiveWorkspace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (opts: { organizationId?: string | null; organizationSlug?: string }) =>
      setActiveWorkspace(opts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authQueryKey });
      qc.invalidateQueries({ queryKey: workspacesQueryKey });
      sileo.success({
        title: "Workspace set as active",
        description: "Your active workspace has been updated.",
      });
    },
  });
}

export function useInviteMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: InviteMemberInput) => inviteMember(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: workspacesQueryKey }),
  });
}

export function useCancelInvitation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => cancelInvitation(invitationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspacesQueryKey });
      sileo.success({
        title: "Invitation canceled",
        description: "The invitation has been canceled.",
      });
    },
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => acceptInvitation(invitationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authQueryKey });
      qc.invalidateQueries({ queryKey: workspacesQueryKey });
      sileo.success({
        title: "Invitation accepted",
        description: "You have joined the workspace.",
      });
    },
  });
}

export function useRejectInvitation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => rejectInvitation(invitationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspacesQueryKey });
      sileo.success({
        title: "Invitation rejected",
        description: "You have rejected the invitation.",
      });
    },
  });
}

export function useRemoveMember(organizationId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (memberIdOrEmail: string) => removeMember(memberIdOrEmail, organizationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspacesQueryKey });
      sileo.success({
        title: "Member removed",
        description: "The member has been removed from the workspace.",
      });
    },
  });
}

export function useUpdateMemberRole(organizationId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: WorkspaceRole }) =>
      updateMemberRole(memberId, role, organizationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspacesQueryKey });
      sileo.success({
        title: "Member role updated",
        description: "The member's role has been updated.",
      });
    },
  });
}

export function useLeaveWorkspace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) => leaveWorkspace(organizationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: authQueryKey });
      qc.invalidateQueries({ queryKey: workspacesQueryKey });
      sileo.success({
        title: "Left workspace",
        description: "You have left the workspace.",
      });
    },
  });
}

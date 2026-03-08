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
import { useSession } from "@/lib/auth-client";
import {
  CreateWorkspace,
  InviteMemberInput,
  UpdateWorkspace,
  WorkspaceRole,
} from "@workspace/validators";
import { workspaceKeys } from "@/lib/query-keys";
import { sileo } from "sileo";

export function useWorkspaces() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: workspaceKeys.lists(),
    queryFn: listWorkspaces,
    enabled: !!session?.user,
    staleTime: 60 * 5000, // 5 minutes
  });
}

export function useWorkspace(opts: { organizationId?: string; organizationSlug?: string } = {}) {
  const { data: session } = useSession();
  const key = opts.organizationId ?? opts.organizationSlug ?? "active";
  return useQuery({
    queryKey: workspaceKeys.detail(key),
    queryFn: () => getFullWorkspace(opts),
    enabled: !!session?.user,
  });
}

export function useActiveWorkspace() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: workspaceKeys.active(),
    queryFn: () => getFullWorkspace(),
    enabled: !!session?.user,
    // placeholderData keeps previous data while refetching
    placeholderData: (prev) => prev,
  });
}

export function useInvitation(invitationId: string | null) {
  return useQuery({
    queryKey: workspaceKeys.invitation(invitationId ?? ""),
    queryFn: () => getInvitation(invitationId!),
    enabled: !!invitationId,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: false,
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkspace) => createWorkspace(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
      sileo.success({ title: "Workspace created", description: "Your new workspace is ready." });
    },
  });
}

export function useUpdateWorkspace(organizationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateWorkspace) => updateWorkspace(organizationId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
      qc.invalidateQueries({ queryKey: workspaceKeys.detail(organizationId) });
      qc.invalidateQueries({ queryKey: workspaceKeys.active() });
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
      qc.invalidateQueries({ queryKey: workspaceKeys.all });
      sileo.success({ title: "Workspace deleted", description: "The workspace has been deleted." });
    },
  });
}

export function useSetActiveWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: { organizationId?: string | null; organizationSlug?: string }) =>
      setActiveWorkspace(opts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.active() });
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
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: workspaceKeys.invitations(variables.organizationId),
      });
    },
  });
}

export function useCancelInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => cancelInvitation(invitationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.invitations() });
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
      qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
      qc.invalidateQueries({ queryKey: workspaceKeys.active() });
      sileo.success({
        title: "Invitation accepted",
        description: "You have joined the workspace.",
      });
    },
  });
}

export function useRejectInvitation() {
  return useMutation({
    mutationFn: (invitationId: string) => rejectInvitation(invitationId),
    onSuccess: () => {
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
      qc.invalidateQueries({ queryKey: workspaceKeys.active() });
      if (organizationId) {
        qc.invalidateQueries({ queryKey: workspaceKeys.detail(organizationId) });
      }
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
      qc.invalidateQueries({ queryKey: workspaceKeys.active() });
      if (organizationId) {
        qc.invalidateQueries({ queryKey: workspaceKeys.detail(organizationId) });
      }
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
      qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
      qc.invalidateQueries({ queryKey: workspaceKeys.active() });
      sileo.success({
        title: "Left workspace",
        description: "You have left the workspace.",
      });
    },
  });
}

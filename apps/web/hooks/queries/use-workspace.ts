import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import type { InviteMemberInput, WorkspaceRole } from "@workspace/validators/types/workspace";
import type { CreateWorkspace, UpdateWorkspace } from "@workspace/validators/schemas/workspace";
import { QUERY_KEYS } from "@/lib/query-keys";
import { useAuthSession } from "@/hooks/queries/use-auth";

export function useWorkspaces() {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.WORKSPACES],
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
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUTH] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      toast.success("Workspace created", { description: "Your new workspace is ready." });
    },
  });
}

export function useUpdateWorkspace(organizationId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWorkspace) => updateWorkspace(organizationId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      toast.success("Workspace updated", {
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
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUTH] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      toast.success("Workspace deleted", {
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
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUTH] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      toast.success("Workspace set as active", {
        description: "Your active workspace has been updated.",
      });
    },
  });
}

export function useInviteMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: InviteMemberInput) => inviteMember(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] }),
  });
}

export function useCancelInvitation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => cancelInvitation(invitationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      toast.success("Invitation canceled", {
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
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUTH] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      toast.success("Invitation accepted", {
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
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      toast.success("Invitation rejected", {
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
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      toast.success("Member removed", {
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
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      toast.success("Member role updated", {
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
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUTH] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.WORKSPACES] });
      toast.success("Left workspace", {
        description: "You have left the workspace.",
      });
    },
  });
}

export function useRestoreActiveWorkspace() {
  const { data: session } = useAuthSession();
  const { data: workspaces } = useWorkspaces();
  const setActive = useSetActiveWorkspace();

  useEffect(() => {
    const firstWorkspace = workspaces?.[0];
    if (
      session?.user &&
      session.session &&
      !session.session.activeOrganizationId &&
      firstWorkspace &&
      !setActive.isPending
    ) {
      setActive.mutate({ organizationId: firstWorkspace.id }, { onSuccess: () => {} });
    }
  }, [session, workspaces, setActive, setActive.isPending]);
}

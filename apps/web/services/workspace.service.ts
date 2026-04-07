import { authClient } from "@/lib/auth-client";
import { toBetterAuthError } from "@/lib/error";
import { slugify } from "@/lib/utils";
import type {
  AssignableWorkspaceRole,
  InviteMemberInput,
} from "@workspace/validators/types/workspace";
import type { CreateWorkspace, UpdateWorkspace } from "@workspace/validators/schemas/workspace";

export async function createWorkspace(input: CreateWorkspace) {
  const { data, error } = await authClient.organization.create({
    name: input.name,
    slug: input.slug ?? slugify(input.name),
    ...(input.logo !== undefined && { logo: input.logo }),
    ...(input.metadata !== undefined && { metadata: input.metadata }),
  });
  if (error) throw toBetterAuthError(error, "Failed to create workspace");
  return data;
}

export async function listWorkspaces() {
  const { data, error } = await authClient.organization.list();
  if (error) throw toBetterAuthError(error, "Failed to list workspaces");
  return data;
}

export async function getFullWorkspace(
  opts: { organizationId?: string; organizationSlug?: string; membersLimit?: number } = {},
) {
  const { data, error } = await authClient.organization.getFullOrganization({
    query: opts,
  });
  if (error) throw toBetterAuthError(error, "Failed to fetch workspace");
  return data;
}

export async function updateWorkspace(organizationId: string, input: UpdateWorkspace) {
  const { data, error } = await authClient.organization.update({
    organizationId,
    data: input,
  });
  if (error) throw toBetterAuthError(error, "Failed to update workspace");
  return data;
}

//only owner
export async function deleteWorkspace(organizationId: string) {
  const { data, error } = await authClient.organization.delete({ organizationId });
  if (error) throw toBetterAuthError(error, "Failed to delete workspace");
  return data;
}

export async function setActiveWorkspace(
  opts: { organizationId?: string | null; organizationSlug?: string } = {},
) {
  const { data, error } = await authClient.organization.setActive(opts);
  if (error) throw toBetterAuthError(error, "Failed to switch workspace");
  return data;
}

export async function removeMember(memberIdOrEmail: string, organizationId?: string) {
  const { data, error } = await authClient.organization.removeMember({
    memberIdOrEmail,
    ...(organizationId !== undefined && { organizationId }),
  });
  if (error) throw toBetterAuthError(error, "Failed to remove member");
  return data;
}

export async function updateMemberRole(
  memberId: string,
  role: AssignableWorkspaceRole,
  organizationId?: string,
) {
  const { data, error } = await authClient.organization.updateMemberRole({
    memberId,
    role,
    ...(organizationId !== undefined && { organizationId }),
  });
  if (error) throw toBetterAuthError(error, "Failed to update member role");
  return data;
}

export async function leaveWorkspace(organizationId: string) {
  const { data, error } = await authClient.organization.leave({ organizationId });
  if (error) throw toBetterAuthError(error, "Failed to leave workspace");
  return data;
}

export async function inviteMember(input: InviteMemberInput) {
  const { data, error } = await authClient.organization.inviteMember({
    email: input.email,
    role: input.role,
    ...(input.organizationId !== undefined && { organizationId: input.organizationId }),
    ...(input.resend !== undefined && { resend: input.resend }),
  });
  if (error) throw toBetterAuthError(error, "Failed to send invitation");
  return data;
}

export async function cancelInvitation(invitationId: string) {
  const { data, error } = await authClient.organization.cancelInvitation({
    invitationId,
  });
  if (error) throw toBetterAuthError(error, "Failed to cancel invitation");
  return data;
}

export async function getInvitation(invitationId: string) {
  const { data, error } = await authClient.organization.getInvitation({
    query: { id: invitationId },
  });
  if (error) throw toBetterAuthError(error, "Failed to fetch invitation");
  return data;
}

export async function acceptInvitation(invitationId: string) {
  const { data, error } = await authClient.organization.acceptInvitation({
    invitationId,
  });
  if (error) throw toBetterAuthError(error, "Failed to accept invitation");
  return data;
}

export async function rejectInvitation(invitationId: string) {
  const { data, error } = await authClient.organization.rejectInvitation({
    invitationId,
  });
  if (error) throw toBetterAuthError(error, "Failed to reject invitation");
  return data;
}

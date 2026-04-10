import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import { useAuthSession } from "@/hooks/queries/use-auth";
import {
  bulkDeleteOrganizations,
  createOrganization,
  deleteOrganization,
  getOrganization,
  listOrganizations,
  updateOrganization,
} from "@/services/crm/orgs.service";
import type {
  BulkDeleteInput,
  CreateOrganizationInput,
  Organization,
  OrganizationsListParams,
  OrganizationsListResponse,
  UpdateOrganizationInput,
} from "@/types/crm";

function getOrganizationsListQueryKey(params: OrganizationsListParams = {}) {
  return [QUERY_KEYS.ORGS, QUERY_KEYS.ORGS_LIST, params] as const;
}

function getOrganizationDetailQueryKey(orgId: string) {
  return [QUERY_KEYS.ORGS, QUERY_KEYS.ORGS_DETAIL, orgId] as const;
}

export function useOrganizations(params: OrganizationsListParams = {}) {
  const { data: session } = useAuthSession();

  return useQuery<OrganizationsListResponse>({
    queryKey: getOrganizationsListQueryKey(params),
    queryFn: () => listOrganizations(params),
    enabled: !!session?.user,
    placeholderData: (prev) => prev,
  });
}

export function useOrg(orgId?: string | null) {
  const { data: session } = useAuthSession();

  return useQuery<Organization>({
    queryKey: getOrganizationDetailQueryKey(orgId ?? ""),
    queryFn: () => getOrganization(orgId!),
    enabled: !!session?.user && !!orgId,
  });
}

export function useCreateOrg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => createOrganization(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
      toast.success("Organization created", {
        description: "The organization has been created successfully.",
      });
    },
  });
}

export function useUpdateOrg(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => updateOrganization(orgId, input),
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
      queryClient.setQueryData(getOrganizationDetailQueryKey(org.id), org);
      toast.success("Organization updated", {
        description: "The organization has been updated successfully.",
      });
    },
  });
}

export function useDeleteOrg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orgId: string) => deleteOrganization(orgId),
    onSuccess: (_, orgId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
      queryClient.removeQueries({ queryKey: getOrganizationDetailQueryKey(orgId) });
      toast.success("Organization deleted", {
        description: "The organization has been deleted successfully.",
      });
    },
  });
}

export function useBulkDeleteOrgs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkDeleteInput) => bulkDeleteOrganizations(input),
    onSuccess: (deletedCount) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
      toast.success("Organizations deleted", {
        description:
          deletedCount === 1
            ? "1 organization was deleted successfully."
            : `${deletedCount} organizations were deleted successfully.`,
      });
    },
  });
}

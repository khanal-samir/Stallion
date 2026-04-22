import { apiClient } from "@/lib/axios-client";
import { cleanQueryParams } from "@/services/crm/utils";
import type {
  BulkDeleteInput,
  CreateOrg,
  ListOrgsQuery,
  OrgParams,
  UpdateOrg,
} from "@workspace/validators/schemas/crm";
import type { ApiSuccessResponse } from "@workspace/validators/types/auth";
import type { BulkDeleteResponse, Organization, OrganizationsListResponse } from "@/types/crm";

type OrganizationResponse = ApiSuccessResponse<{
  org: Organization;
}>;

export async function listOrganizations(params: Partial<ListOrgsQuery> = {}) {
  const response = await apiClient.get<ApiSuccessResponse<OrganizationsListResponse>>("/org", {
    params: cleanQueryParams(params),
  });

  const { data } = response.data;
  return data;
}

export async function getOrganization(id: OrgParams["id"]) {
  const response = await apiClient.get<OrganizationResponse>(`/org/${id}`);
  const { data } = response.data;
  return data.org;
}

export async function createOrganization(input: CreateOrg) {
  const response = await apiClient.post<OrganizationResponse>("/org", input);
  const { data } = response.data;
  return data.org;
}

export async function updateOrganization(id: OrgParams["id"], input: UpdateOrg) {
  const response = await apiClient.patch<OrganizationResponse>(`/org/${id}`, input);
  const { data } = response.data;
  return data.org;
}

export async function deleteOrganization(id: OrgParams["id"]) {
  const response = await apiClient.delete<OrganizationResponse>(`/org/${id}`);
  const { data } = response.data;
  return data.org;
}

export async function bulkDeleteOrganizations(input: BulkDeleteInput) {
  const response = await apiClient.delete<ApiSuccessResponse<BulkDeleteResponse>>("/org/bulk", {
    data: input,
  });

  const { data } = response.data;
  return data.deleted;
}

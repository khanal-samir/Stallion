import { apiClient } from "@/lib/axios-client";
import type { ApiSuccessResponse } from "@workspace/validators/types/auth";
import type {
  CreateOrg,
  UpdateOrg,
  Org,
  OrgListParams,
  ListMeta,
} from "@workspace/validators/schemas/crm";

export type { Org, OrgListParams, ListMeta as OrgListMeta };

type OrgsListResponse = ApiSuccessResponse<{ orgs: Org[]; meta: ListMeta }>;
type OrgDetailResponse = ApiSuccessResponse<{ org: Org }>;

export async function listOrgs(params?: OrgListParams) {
  const { data } = await apiClient.get<OrgsListResponse>("/orgs", { params });
  return data.data;
}

export async function getOrg(id: string) {
  const { data } = await apiClient.get<OrgDetailResponse>(`/orgs/${id}`);
  return data.data;
}

export async function createOrg(input: CreateOrg) {
  const { data } = await apiClient.post<OrgDetailResponse>("/orgs", input);
  return data.data;
}

export async function updateOrg(id: string, input: UpdateOrg) {
  const { data } = await apiClient.patch<OrgDetailResponse>(`/orgs/${id}`, input);
  return data.data;
}

export async function deleteOrg(id: string) {
  const { data } = await apiClient.delete<OrgDetailResponse>(`/orgs/${id}`);
  return data.data;
}

export async function bulkDeleteOrgs(ids: string[]) {
  const { data } = await apiClient.post<ApiSuccessResponse<{ deleted: number }>>(
    "/orgs/bulk-delete",
    { ids },
  );
  return data.data;
}

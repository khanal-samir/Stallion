import { apiClient } from "@/lib/axios-client";
import type { ApiSuccessResponse } from "@workspace/validators/types/auth";
import type {
  CreateDeal,
  UpdateDeal,
  Deal,
  DealListParams,
  DealStage,
} from "@workspace/validators/schemas/crm";

export type { Deal, DealListParams, DealStage };

type DealsListResponse = ApiSuccessResponse<{ deals: Deal[] }>;
type DealDetailResponse = ApiSuccessResponse<{ deal: Deal }>;

export async function listDeals(params?: DealListParams) {
  const { data } = await apiClient.get<DealsListResponse>("/deals", { params });
  return data.data;
}

export async function getDeal(id: string) {
  const { data } = await apiClient.get<DealDetailResponse>(`/deals/${id}`);
  return data.data;
}

export async function createDeal(input: CreateDeal) {
  const { data } = await apiClient.post<DealDetailResponse>("/deals", input);
  return data.data;
}

export async function updateDeal(id: string, input: UpdateDeal) {
  const { data } = await apiClient.patch<DealDetailResponse>(`/deals/${id}`, input);
  return data.data;
}

export async function deleteDeal(id: string) {
  const { data } = await apiClient.delete<DealDetailResponse>(`/deals/${id}`);
  return data.data;
}

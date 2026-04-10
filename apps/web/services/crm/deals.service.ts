import { apiClient } from "@/lib/axios-client";
import type { CreateDeal, ListDealsQuery, UpdateDeal } from "@workspace/validators/schemas/crm";
import type { ApiSuccessResponse } from "@workspace/validators/types/auth";
import type { Deal, DealsListResponse } from "@/types/crm";
import { cleanQueryParams, unwrapApiResponse } from "./utils";

type DealResponse = ApiSuccessResponse<{ deal: Deal }>;
type DealsResponse = ApiSuccessResponse<DealsListResponse>;

export async function listDeals(params: Partial<ListDealsQuery> = {}) {
  const response = await apiClient.get<DealsResponse>("/deals", {
    params: cleanQueryParams(params),
  });

  return unwrapApiResponse(response.data);
}

export async function getDeal(id: string) {
  const response = await apiClient.get<DealResponse>(`/deals/${id}`);
  return unwrapApiResponse(response.data).deal;
}

export async function createDeal(input: CreateDeal) {
  const response = await apiClient.post<DealResponse>("/deals", input);
  return unwrapApiResponse(response.data).deal;
}

export async function updateDeal(id: string, input: UpdateDeal) {
  const response = await apiClient.patch<DealResponse>(`/deals/${id}`, input);
  return unwrapApiResponse(response.data).deal;
}

export async function deleteDeal(id: string) {
  const response = await apiClient.delete<DealResponse>(`/deals/${id}`);
  return unwrapApiResponse(response.data).deal;
}

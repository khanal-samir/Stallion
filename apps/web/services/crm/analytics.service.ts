import { apiClient } from "@/lib/axios-client";
import type { ApiSuccessResponse } from "@workspace/validators/types/auth";

export interface PipelineStage {
  stage: string;
  count: number;
}

export interface PeopleStatus {
  status: string;
  count: number;
}

export interface WinRate {
  won: number;
  lost: number;
  total: number;
  rate: number;
}

type PipelineResponse = ApiSuccessResponse<{ pipeline: PipelineStage[] }>;
type PeopleStatusResponse = ApiSuccessResponse<{ peopleStatus: PeopleStatus[] }>;
type WinRateResponse = ApiSuccessResponse<WinRate>;

export async function getPipelineByStage() {
  const response = await apiClient.get<PipelineResponse>("/analytics/pipeline");
  return response.data.data.pipeline;
}

export async function getPeopleByStatus() {
  const response = await apiClient.get<PeopleStatusResponse>("/analytics/people-status");
  return response.data.data.peopleStatus;
}

export async function getWinRate() {
  const response = await apiClient.get<WinRateResponse>("/analytics/win-rate");
  return response.data.data;
}

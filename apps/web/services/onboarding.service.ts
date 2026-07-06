import { apiClient } from "@/lib/axios-client";
import type { ApiSuccessResponse } from "@workspace/validators/types/auth";

export interface OnboardingStatus {
  crmTourCompleted: boolean;
  crmTourCompletedAt: string | null;
}

type OnboardingStatusResponse = ApiSuccessResponse<OnboardingStatus>;

export async function getOnboardingStatus() {
  const response = await apiClient.get<OnboardingStatusResponse>("/onboarding");
  return response.data.data;
}

export async function completeCrmTour() {
  const response = await apiClient.post<OnboardingStatusResponse>("/onboarding/crm-tour/complete");
  return response.data.data;
}

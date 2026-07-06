import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/hooks/queries/use-auth";
import { QUERY_KEYS } from "@/lib/query-keys";
import { completeCrmTour, getOnboardingStatus } from "@/services/onboarding.service";

const onboardingStatusQueryKey = [QUERY_KEYS.ONBOARDING, QUERY_KEYS.CRM_TOUR] as const;

export function useOnboardingStatus() {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: onboardingStatusQueryKey,
    queryFn: getOnboardingStatus,
    enabled: Boolean(session?.user),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompleteCrmTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeCrmTour,
    onSuccess: (status) => {
      queryClient.setQueryData(onboardingStatusQueryKey, status);
    },
  });
}

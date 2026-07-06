import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/query-keys";
import { useAuthSession } from "@/hooks/queries/use-auth";
import {
  getPipelineByStage,
  getPeopleByStatus,
  getWinRate,
} from "@/services/crm/analytics.service";

export function usePipelineByStage() {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.ANALYTICS, QUERY_KEYS.ANALYTICS_PIPELINE],
    queryFn: getPipelineByStage,
    enabled: !!session?.user,
  });
}

export function usePeopleByStatus() {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.ANALYTICS, QUERY_KEYS.ANALYTICS_PEOPLE_STATUS],
    queryFn: getPeopleByStatus,
    enabled: !!session?.user,
  });
}

export function useWinRate() {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.ANALYTICS, QUERY_KEYS.ANALYTICS_WIN_RATE],
    queryFn: getWinRate,
    enabled: !!session?.user,
  });
}

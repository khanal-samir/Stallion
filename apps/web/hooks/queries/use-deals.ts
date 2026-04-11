import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import type { DealListParams, DealStage, Deal } from "@/services/deals.service";
import { listDeals, getDeal, createDeal, updateDeal, deleteDeal } from "@/services/deals.service";
import type { CreateDeal, UpdateDeal } from "@workspace/validators/schemas/crm";

export function useDeals(params?: DealListParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.DEALS, QUERY_KEYS.DEALS_LIST, params],
    queryFn: () => listDeals(params),
  });
}

export function useDeal(id: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.DEALS, QUERY_KEYS.DEALS_DETAIL, id],
    queryFn: () => getDeal(id!),
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDeal) => createDeal(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.DEALS] });
      toast.success("Deal created", { description: "The deal has been added." });
    },
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDeal }) => updateDeal(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.DEALS] });
      toast.success("Deal updated", { description: "The deal has been updated." });
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDeal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.DEALS] });
      toast.success("Deal deleted", { description: "The deal has been removed." });
    },
  });
}

export function useMoveDealStage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) => updateDeal(id, { stage }),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: [QUERY_KEYS.DEALS, QUERY_KEYS.DEALS_LIST] });

      const previousSnapshots = qc.getQueriesData<{ deals: Deal[] }>({
        queryKey: [QUERY_KEYS.DEALS, QUERY_KEYS.DEALS_LIST],
      });

      qc.setQueriesData<{ deals: Deal[] }>(
        { queryKey: [QUERY_KEYS.DEALS, QUERY_KEYS.DEALS_LIST] },
        (old) => {
          if (!old?.deals) return old;
          return {
            ...old,
            deals: old.deals.map((d) => (d.id === id ? { ...d, stage } : d)),
          };
        },
      );

      return { previousSnapshots };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSnapshots) {
        for (const [queryKey, snapshot] of context.previousSnapshots) {
          qc.setQueryData(queryKey, snapshot);
        }
      }
      toast.error("Failed to move deal", { description: "The change has been reverted." });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.DEALS] });
      toast.success("Deal moved", { description: "The deal stage has been updated." });
    },
  });
}

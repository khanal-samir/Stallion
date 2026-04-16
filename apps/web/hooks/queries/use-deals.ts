import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateDeal, UpdateDeal } from "@workspace/validators/schemas/crm";
import {
  createDeal,
  deleteDeal,
  getDeal,
  listDeals,
  updateDeal,
} from "@/services/crm/deals.service";
import { QUERY_KEYS } from "@/lib/query-keys";
import { useAuthSession } from "@/hooks/queries/use-auth";
import type { DealsListParams } from "@/types/crm";

export function useDeals(params: DealsListParams = {}) {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.DEALS, QUERY_KEYS.DEALS_LIST, params],
    queryFn: () => listDeals(params),
    enabled: !!session?.user,
    placeholderData: (prev) => prev,
  });
}

export function useDeal(dealId?: string | null) {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.DEALS, QUERY_KEYS.DEALS_DETAIL, dealId ?? ""],
    queryFn: () => getDeal(dealId!),
    enabled: !!session?.user && !!dealId,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDeal) => createDeal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEALS] });
      toast.success("Deal created", {
        description: "The deal has been added successfully.",
      });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dealId, input }: { dealId: string; input: UpdateDeal }) =>
      updateDeal(dealId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEALS] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DEALS, QUERY_KEYS.DEALS_DETAIL, variables.dealId],
      });
      toast.success("Deal updated", {
        description: "The deal has been updated successfully.",
      });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dealId: string) => deleteDeal(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DEALS] });
      toast.success("Deal deleted", {
        description: "The deal has been removed successfully.",
      });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import type { OrgListParams } from "@/services/orgs.service";
import {
  listOrgs,
  getOrg,
  createOrg,
  updateOrg,
  deleteOrg,
  bulkDeleteOrgs,
} from "@/services/orgs.service";
import type { CreateOrg, UpdateOrg } from "@workspace/validators/schemas/crm";

export function useOrgs(params?: OrgListParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.ORGS, QUERY_KEYS.ORGS_LIST, params],
    queryFn: () => listOrgs(params),
  });
}

export function useOrg(id: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.ORGS, QUERY_KEYS.ORGS_DETAIL, id],
    queryFn: () => getOrg(id!),
    enabled: !!id,
  });
}

export function useCreateOrg() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrg) => createOrg(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
      toast.success("Organization created", { description: "The organization has been added." });
    },
  });
}

export function useUpdateOrg() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOrg }) => updateOrg(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
      toast.success("Organization updated", { description: "The organization has been updated." });
    },
  });
}

export function useDeleteOrg() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteOrg(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
      toast.success("Organization deleted", { description: "The organization has been removed." });
    },
  });
}

export function useBulkDeleteOrgs() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteOrgs(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
      toast.success("Organizations deleted", {
        description: "The selected organizations have been removed.",
      });
    },
  });
}

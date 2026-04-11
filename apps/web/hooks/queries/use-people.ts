import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import type { PersonListParams } from "@/services/people.service";
import {
  listPeople,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
  bulkDeletePeople,
} from "@/services/people.service";
import type { CreatePerson, UpdatePerson } from "@workspace/validators/schemas/crm";

export function usePeople(params?: PersonListParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.PEOPLE, QUERY_KEYS.PEOPLE_LIST, params],
    queryFn: () => listPeople(params),
  });
}

export function usePerson(id: string | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.PEOPLE, QUERY_KEYS.PEOPLE_DETAIL, id],
    queryFn: () => getPerson(id!),
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePerson) => createPerson(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PEOPLE] });
      toast.success("Person created", { description: "The person has been added." });
    },
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePerson }) => updatePerson(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PEOPLE] });
      toast.success("Person updated", { description: "The person has been updated." });
    },
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PEOPLE] });
      toast.success("Person deleted", { description: "The person has been removed." });
    },
  });
}

export function useBulkDeletePeople() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => bulkDeletePeople(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PEOPLE] });
      toast.success("People deleted", { description: "The selected people have been removed." });
    },
  });
}

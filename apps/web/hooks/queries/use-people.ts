import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import { useAuthSession } from "@/hooks/queries/use-auth";
import {
  bulkDeletePeople,
  createPerson,
  deletePerson,
  getPerson,
  listPeople,
  updatePerson,
} from "@/services/crm/people.service";
import type {
  BulkDeleteInput,
  CreatePersonInput,
  PeopleListParams,
  UpdatePersonInput,
} from "@/types/crm";

export function usePeople(params: PeopleListParams = {}) {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.PEOPLE, QUERY_KEYS.PEOPLE_LIST, params],
    queryFn: () => listPeople(params),
    enabled: !!session?.user,
    placeholderData: (previousData) => previousData,
  });
}

export function usePerson(personId?: string | null) {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.PEOPLE, QUERY_KEYS.PEOPLE_DETAIL, personId ?? ""],
    queryFn: () => getPerson(personId!),
    enabled: !!session?.user && !!personId,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePersonInput) => createPerson(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PEOPLE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
      toast.success("Person created", {
        description: "The person has been added to your CRM.",
      });
    },
  });
}

export function useUpdatePerson(personId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePersonInput) => updatePerson(personId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PEOPLE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
      toast.success("Person updated", {
        description: "The person has been updated.",
      });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personId: string) => deletePerson(personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PEOPLE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
      toast.success("Person deleted", {
        description: "The person has been removed from your CRM.",
      });
    },
  });
}

export function useBulkDeletePeople() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkDeleteInput) => bulkDeletePeople(input),
    onSuccess: (deletedCount) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PEOPLE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
      toast.success("People deleted", {
        description:
          deletedCount === 1
            ? "1 person has been removed from your CRM."
            : `${deletedCount} people have been removed from your CRM.`,
      });
    },
  });
}

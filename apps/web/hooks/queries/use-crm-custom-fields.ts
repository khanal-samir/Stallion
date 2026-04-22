import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/lib/query-keys";
import { useAuthSession } from "@/hooks/queries/use-auth";
import {
  createOrgCustomField,
  createPeopleCustomField,
  deleteOrgCustomField,
  deletePeopleCustomField,
  listOrgCustomFields,
  listPeopleCustomFields,
  updateOrgCustomField,
  updatePeopleCustomField,
} from "@/services/crm/custom-fields.service";
import type {
  CreateCustomFieldDefinition,
  CustomFieldDefinition,
  UpdateCustomFieldDefinition,
} from "@/types/crm";

function invalidateCrmCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PEOPLE] });
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS] });
}

export function usePeopleCustomFields(options?: { enabled?: boolean }) {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.PEOPLE, QUERY_KEYS.PEOPLE_CUSTOM_FIELDS],
    queryFn: listPeopleCustomFields,
    enabled: !!session?.user && (options?.enabled ?? true),
    placeholderData: (previousData) => previousData,
  });
}

export function useOrgCustomFields(options?: { enabled?: boolean }) {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: [QUERY_KEYS.ORGS, QUERY_KEYS.ORGS_CUSTOM_FIELDS],
    queryFn: listOrgCustomFields,
    enabled: !!session?.user && (options?.enabled ?? true),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreatePeopleCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomFieldDefinition) => createPeopleCustomField(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PEOPLE, QUERY_KEYS.PEOPLE_CUSTOM_FIELDS],
      });
      invalidateCrmCaches(queryClient);
      toast.success("Custom field created", {
        description: "The people custom field has been created.",
      });
    },
  });
}

export function useCreateOrgCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomFieldDefinition) => createOrgCustomField(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS, QUERY_KEYS.ORGS_CUSTOM_FIELDS] });
      invalidateCrmCaches(queryClient);
      toast.success("Custom field created", {
        description: "The organization custom field has been created.",
      });
    },
  });
}

export function useUpdatePeopleCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomFieldDefinition }) =>
      updatePeopleCustomField(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PEOPLE, QUERY_KEYS.PEOPLE_CUSTOM_FIELDS],
      });
      invalidateCrmCaches(queryClient);
      toast.success("Custom field updated", {
        description: "The people custom field has been updated.",
      });
    },
  });
}

export function useUpdateOrgCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomFieldDefinition }) =>
      updateOrgCustomField(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS, QUERY_KEYS.ORGS_CUSTOM_FIELDS] });
      invalidateCrmCaches(queryClient);
      toast.success("Custom field updated", {
        description: "The organization custom field has been updated.",
      });
    },
  });
}

export function useDeletePeopleCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePeopleCustomField(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PEOPLE, QUERY_KEYS.PEOPLE_CUSTOM_FIELDS],
      });
      invalidateCrmCaches(queryClient);
      toast.success("Custom field deleted", {
        description: "The people custom field has been deleted.",
      });
    },
  });
}

export function useDeleteOrgCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteOrgCustomField(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGS, QUERY_KEYS.ORGS_CUSTOM_FIELDS] });
      invalidateCrmCaches(queryClient);
      toast.success("Custom field deleted", {
        description: "The organization custom field has been deleted.",
      });
    },
  });
}

export function mapCustomFieldsById(customFields: CustomFieldDefinition[]) {
  return new Map(customFields.map((field) => [field.id, field]));
}

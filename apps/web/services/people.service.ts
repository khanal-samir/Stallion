import { apiClient } from "@/lib/axios-client";
import type { ApiSuccessResponse } from "@workspace/validators/types/auth";
import type {
  CreatePerson,
  UpdatePerson,
  Person,
  PersonListParams,
  ListMeta,
} from "@workspace/validators/schemas/crm";

export type { Person, PersonListParams, ListMeta as PersonListMeta };

type PeopleListResponse = ApiSuccessResponse<{ people: Person[]; meta: ListMeta }>;
type PersonDetailResponse = ApiSuccessResponse<{ person: Person }>;

export async function listPeople(params?: PersonListParams) {
  const { data } = await apiClient.get<PeopleListResponse>("/people", { params });
  return data.data;
}

export async function getPerson(id: string) {
  const { data } = await apiClient.get<PersonDetailResponse>(`/people/${id}`);
  return data.data;
}

export async function createPerson(input: CreatePerson) {
  const { data } = await apiClient.post<PersonDetailResponse>("/people", input);
  return data.data;
}

export async function updatePerson(id: string, input: UpdatePerson) {
  const { data } = await apiClient.patch<PersonDetailResponse>(`/people/${id}`, input);
  return data.data;
}

export async function deletePerson(id: string) {
  const { data } = await apiClient.delete<PersonDetailResponse>(`/people/${id}`);
  return data.data;
}

export async function bulkDeletePeople(ids: string[]) {
  const { data } = await apiClient.post<ApiSuccessResponse<{ deleted: number }>>(
    "/people/bulk-delete",
    { ids },
  );
  return data.data;
}

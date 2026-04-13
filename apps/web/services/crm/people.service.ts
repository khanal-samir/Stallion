import { apiClient } from "@/lib/axios-client";
import type { ApiSuccessResponse } from "@workspace/validators/types/auth";
import type {
  BulkDeleteInput,
  CreatePerson,
  ListPeopleQuery,
  PersonParams,
  UpdatePerson,
} from "@workspace/validators/schemas/crm";
import type { Person, PeopleListResponse } from "@/types/crm";
import { cleanQueryParams } from "./utils";

type PersonResponse = ApiSuccessResponse<{ person: Person }>;
type PeopleResponse = ApiSuccessResponse<PeopleListResponse>;
type BulkDeletePeopleResponse = ApiSuccessResponse<{ deleted: number }>;

export async function listPeople(params: Partial<ListPeopleQuery> = {}) {
  const response = await apiClient.get<PeopleResponse>("/people", {
    params: cleanQueryParams(params),
  });

  const { data } = response.data;
  return data;
}

export async function getPerson(id: PersonParams["id"]) {
  const response = await apiClient.get<PersonResponse>(`/people/${id}`);
  const { data } = response.data;
  return data.person;
}

export async function createPerson(input: CreatePerson) {
  const response = await apiClient.post<PersonResponse>("/people", input);
  const { data } = response.data;
  return data.person;
}

export async function updatePerson(id: PersonParams["id"], input: UpdatePerson) {
  const response = await apiClient.patch<PersonResponse>(`/people/${id}`, input);
  const { data } = response.data;
  return data.person;
}

export async function deletePerson(id: PersonParams["id"]) {
  const response = await apiClient.delete<PersonResponse>(`/people/${id}`);
  const { data } = response.data;
  return data.person;
}

export async function bulkDeletePeople(input: BulkDeleteInput) {
  const response = await apiClient.delete<BulkDeletePeopleResponse>("/people/bulk", {
    data: input,
  });

  const { data } = response.data;
  return data.deleted;
}

import { apiClient } from "@/lib/axios-client";
import type { ApiSuccessResponse } from "@workspace/validators/types/auth";
import type {
  CreateCustomFieldDefinition,
  CustomFieldDefinition,
  CustomFieldDefinitionsResponse,
  UpdateCustomFieldDefinition,
} from "@/types/crm";

type CustomFieldDefinitionResponse = ApiSuccessResponse<{ customField: CustomFieldDefinition }>;
type CustomFieldsResponse = ApiSuccessResponse<CustomFieldDefinitionsResponse>;

export async function listPeopleCustomFields() {
  const response = await apiClient.get<CustomFieldsResponse>("/people/custom-fields");
  const { data } = response.data;
  return data.customFields;
}

export async function listOrgCustomFields() {
  const response = await apiClient.get<CustomFieldsResponse>("/orgs/custom-fields");
  const { data } = response.data;
  return data.customFields;
}

export async function createPeopleCustomField(input: CreateCustomFieldDefinition) {
  const response = await apiClient.post<CustomFieldDefinitionResponse>(
    "/people/custom-fields",
    input,
  );
  const { data } = response.data;
  return data.customField;
}

export async function createOrgCustomField(input: CreateCustomFieldDefinition) {
  const response = await apiClient.post<CustomFieldDefinitionResponse>(
    "/orgs/custom-fields",
    input,
  );
  const { data } = response.data;
  return data.customField;
}

export async function updatePeopleCustomField(id: string, input: UpdateCustomFieldDefinition) {
  const response = await apiClient.patch<CustomFieldDefinitionResponse>(
    `/people/custom-fields/${id}`,
    input,
  );
  const { data } = response.data;
  return data.customField;
}

export async function updateOrgCustomField(id: string, input: UpdateCustomFieldDefinition) {
  const response = await apiClient.patch<CustomFieldDefinitionResponse>(
    `/orgs/custom-fields/${id}`,
    input,
  );
  const { data } = response.data;
  return data.customField;
}

export async function deletePeopleCustomField(id: string) {
  const response = await apiClient.delete<CustomFieldDefinitionResponse>(
    `/people/custom-fields/${id}`,
  );
  const { data } = response.data;
  return data.customField;
}

export async function deleteOrgCustomField(id: string) {
  const response = await apiClient.delete<CustomFieldDefinitionResponse>(
    `/orgs/custom-fields/${id}`,
  );
  const { data } = response.data;
  return data.customField;
}

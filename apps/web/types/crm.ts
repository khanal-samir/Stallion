import type {
  CreateCustomFieldDefinitionInput,
  CreateDeal,
  CreateOrg,
  CreatePerson,
  CustomFieldOption,
  CustomFieldType as ValidatorCustomFieldType,
  DealStage,
  ListDealsQuery,
  ListOrgsQuery,
  ListPeopleQuery,
  PersonSource,
  PersonStatus,
  UpdateCustomFieldDefinitionInput,
  UpdateDeal,
  UpdateOrg,
  UpdatePerson,
} from "@workspace/validators/schemas/crm";

export type CustomFieldType = ValidatorCustomFieldType;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface RelatedEntityRef {
  id: string;
  name: string;
}

export interface Person {
  id: string;
  workspaceId: string;
  orgId: string | null;
  ownerId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  linkedinUrl: string | null;
  status: PersonStatus;
  source: PersonSource;
  lastContactedAt: string | null;
  customFields: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  org?: RelatedEntityRef | null;
  owner?: RelatedEntityRef | null;
  orgName?: string | null;
  ownerName?: string | null;
}

export interface Organization {
  id: string;
  workspaceId: string;
  ownerId: string | null;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  customFields: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  peopleCount?: number;
  people?: RelatedEntityRef[];
  owner?: RelatedEntityRef | null;
  ownerName?: string | null;
}

export interface Deal {
  id: string;
  workspaceId: string;
  personId: string | null;
  orgId: string | null;
  ownerId: string | null;
  title: string;
  value: string | null;
  currency: string;
  stage: DealStage;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string;
  personName?: string | null;
  orgName?: string | null;
  ownerName?: string | null;
  people?: RelatedEntityRef[];
  org?: RelatedEntityRef | null;
  person?: RelatedEntityRef | null;
  owner?: RelatedEntityRef | null;
}

export interface PeopleListResponse {
  people: Person[];
  meta: PaginationMeta;
}

export interface OrganizationsListResponse {
  org: Organization[];
  meta: PaginationMeta;
}

export interface DealsListResponse {
  deals: Deal[];
  meta: PaginationMeta;
}

export interface PersonDetailResponse {
  person: Person;
}

export interface OrganizationDetailResponse {
  org: Organization;
}

export interface DealDetailResponse {
  deal: Deal;
}

export interface BulkDeleteResponse {
  deleted: number;
}

export interface CustomFieldDefinition {
  id: string;
  workspaceId: string;
  entityType: "people" | "org";
  fieldType: CustomFieldType;
  label: string;
  options: CustomFieldOption[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldDefinitionsResponse {
  customFields: CustomFieldDefinition[];
}

export type CustomFieldFilterType = "text" | "number" | "select" | "dateTime";

export type CustomFieldFilterValue = {
  fieldId: string;
  type: CustomFieldFilterType;
  value?: string;
  from?: string;
  to?: string;
};

export type PeopleListParams = Partial<ListPeopleQuery>;
export type OrganizationsListParams = Partial<ListOrgsQuery>;
export type DealsListParams = Partial<ListDealsQuery>;

export type CreatePersonInput = CreatePerson;
export type UpdatePersonInput = UpdatePerson;

export type CreateOrganizationInput = CreateOrg;
export type UpdateOrganizationInput = UpdateOrg;

export type CreateDealInput = CreateDeal;
export type UpdateDealInput = UpdateDeal;

export interface BulkDeleteInput {
  ids: string[];
}

export type CreateCustomFieldDefinition = CreateCustomFieldDefinitionInput;
export type UpdateCustomFieldDefinition = UpdateCustomFieldDefinitionInput;

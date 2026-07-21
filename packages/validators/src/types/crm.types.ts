export const PERSON_STATUS_VALUES = [
  "lead",
  "prospect",
  "qualified",
  "customer",
  "churned",
] as const;

export const PERSON_SOURCE_VALUES = ["manual", "csv", "api", "import"] as const;

export const DEAL_STAGE_VALUES = ["new", "contacted", "demo", "proposal", "won", "lost"] as const;

export const ORG_SORT_BY_VALUES = [
  "name",
  "domain",
  "industry",
  "size",
  "location",
  "createdAt",
  "updatedAt",
] as const;

export const PERSON_SORT_BY_VALUES = [
  "name",
  "email",
  "phone",
  "jobTitle",
  "status",
  "source",
  "lastContactedAt",
  "createdAt",
  "updatedAt",
] as const;

export const DEAL_SORT_BY_VALUES = [
  "title",
  "value",
  "currency",
  "stage",
  "closeDate",
  "createdAt",
  "updatedAt",
] as const;

export const SORT_ORDER_VALUES = ["asc", "desc"] as const;

export const CUSTOM_FIELD_ENTITY_TYPE_VALUES = ["people", "org"] as const;

export const CUSTOM_FIELD_TYPE_VALUES = ["text", "number", "select", "dateTime"] as const;

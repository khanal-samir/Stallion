export const QUERY_KEYS = {
  AUTH: "auth", //parent key for all auth related queries
  SESSION: "session",
  WORKSPACES: "workspaces", // parent key for all workspace related queries
  WORKSPACE: "workspace",
  ACTIVE_WORKSPACE: "active-workspace",
  WORKSPACE_INVITATIONS: "workspace-invitations",
  WORKSPACE_INVITATION: "workspace-invitation",

  // CRM
  PEOPLE: "people",
  PEOPLE_LIST: "people-list",
  PEOPLE_DETAIL: "people-detail",
  PEOPLE_CUSTOM_FIELDS: "people-custom-fields",
  ORGS: "org",
  ORGS_LIST: "org-list",
  ORGS_DETAIL: "org-detail",
  ORGS_CUSTOM_FIELDS: "org-custom-fields",
  DEALS: "deals",
  DEALS_LIST: "deals-list",
  DEALS_DETAIL: "deals-detail",
} as const;

export const QUERY_KEYS = {
  AUTH: "auth", //parent key for all auth related queries
  SESSION: "session",
  WORKSPACES: "workspaces", // parent key for all workspace related queries
  WORKSPACE: "workspace",
  ACTIVE_WORKSPACE: "active-workspace",
  WORKSPACE_INVITATIONS: "workspace-invitations",
  WORKSPACE_INVITATION: "workspace-invitation",
  ONBOARDING: "onboarding",
  CRM_TOUR: "crm-tour",

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

  ANALYTICS: "analytics",
  ANALYTICS_PIPELINE: "analytics-pipeline",
  ANALYTICS_PEOPLE_STATUS: "analytics-people-status",
  ANALYTICS_WIN_RATE: "analytics-win-rate",
} as const;

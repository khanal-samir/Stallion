export const QUERY_KEYS = {
  AUTH: "auth", //parent key for all auth related queries
  SESSION: "session",
  WORKSPACES: "workspaces", // parent key for all workspace related queries
  WORKSPACE: "workspace",
  ACTIVE_WORKSPACE: "active-workspace",
  WORKSPACE_INVITATIONS: "workspace-invitations",
  WORKSPACE_INVITATION: "workspace-invitation",
  PEOPLE: "people", // parent key for all people related queries
  PEOPLE_LIST: "people-list",
  PEOPLE_DETAIL: "people-detail",
  ORGS: "orgs", // parent key for all orgs related queries
  ORGS_LIST: "orgs-list",
  ORGS_DETAIL: "orgs-detail",
  DEALS: "deals", // parent key for all deals related queries
  DEALS_LIST: "deals-list",
  DEALS_DETAIL: "deals-detail",
} as const;

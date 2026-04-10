export const QUERY_KEYS = {
  AUTH: "auth", //parent key for all auth related queries
  SESSION: "session",
  WORKSPACES: "workspaces", // parent key for all workspace related queries
  WORKSPACE: "workspace",
  ACTIVE_WORKSPACE: "active-workspace",
  WORKSPACE_INVITATIONS: "workspace-invitations",
  WORKSPACE_INVITATION: "workspace-invitation",
} as const;

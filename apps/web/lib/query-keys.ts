export const workspaceKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
  detail: (id: string) => [...workspaceKeys.all, "detail", id] as const,
  active: () => [...workspaceKeys.all, "active"] as const,
  members: (id?: string) => [...workspaceKeys.all, "members", id] as const,
  invitations: (id?: string) => [...workspaceKeys.all, "invitations", id] as const,
  invitation: (id: string) => [...workspaceKeys.all, "invitation", id] as const,
};

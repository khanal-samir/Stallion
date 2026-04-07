"use client";

import { useState } from "react";
import { Trash2, Users } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/ui/avatar";
import { Badge } from "@workspace/ui/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuthSession } from "@/hooks/queries/use-auth";
import { useRemoveMember, useUpdateMemberRole } from "@/hooks/queries/use-workspace";
import type { WorkspaceRole } from "@workspace/validators/types/workspace";
import { getInitials } from "@/lib/utils";
import { workspaceRoleSchema } from "@workspace/validators/schemas/common";

interface Member {
  id: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

interface MembersSettingsProps {
  members: Member[];
  organizationId: string;
  ownerId?: string;
}

const roleBadgeVariant: Record<
  | typeof workspaceRoleSchema.enum.admin
  | typeof workspaceRoleSchema.enum.member
  | typeof workspaceRoleSchema.enum.owner,
  "default" | "secondary" | "outline"
> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};

export function MembersSettings({ members, organizationId, ownerId }: MembersSettingsProps) {
  const { data: session } = useAuthSession();
  const { mutate: removeMemberMutation, isPending: isRemovePending } =
    useRemoveMember(organizationId);
  const { mutate: updateRoleMutation, isPending: isUpdateRolePending } =
    useUpdateMemberRole(organizationId);

  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  const currentUserId = session?.user?.id;
  const currentMember = members.find((member) => member.userId === currentUserId);
  const canManage = currentMember?.role === "owner" || currentMember?.role === "admin";

  function handleRoleChange(memberId: string, role: WorkspaceRole) {
    updateRoleMutation({ memberId, role });
  }

  function handleRemove() {
    if (!removeTarget) return;

    removeMemberMutation(removeTarget.userId, {
      onSuccess: () => setRemoveTarget(null),
    });
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No members"
        description="This workspace has no members yet."
        className="rounded-lg border border-dashed border-border bg-muted/20"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Members</h2>
          <p className="text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"} in this workspace.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {canManage && <TableHead className="w-14" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const isOwner = member.userId === ownerId;
              const canEditRole = canManage && !isOwner && !isCurrentUser;
              const canRemove = canManage && !isOwner && !isCurrentUser;

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-7">
                        {member.user.image && (
                          <AvatarImage src={member.user.image} alt={member.user.name} />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {member.user.name}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canEditRole ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(member.id, value as WorkspaceRole)
                        }
                        disabled={isUpdateRolePending}
                      >
                        <SelectTrigger className="h-7 w-24 cursor-pointer text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member" className="cursor-pointer text-xs">
                            Member
                          </SelectItem>
                          <SelectItem value="admin" className="cursor-pointer text-xs">
                            Admin
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={roleBadgeVariant[member.role] ?? "outline"}
                        className="text-xs"
                      >
                        {member.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {canRemove && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="cursor-pointer text-muted-foreground hover:text-destructive"
                          onClick={() => setRemoveTarget(member)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Remove member</span>
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove member"
        description={
          removeTarget
            ? `Remove ${removeTarget.user.name} (${removeTarget.user.email}) from this workspace? They will lose access immediately.`
            : ""
        }
        confirmLabel="Remove"
        variant="destructive"
        isPending={isRemovePending}
        onConfirm={handleRemove}
      />
    </div>
  );
}

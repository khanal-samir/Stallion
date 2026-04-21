"use client";

import { useState } from "react";
import { Mail, Plus, X } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui/table";
import { Badge } from "@workspace/ui/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import { useCancelInvitation } from "@/hooks/queries/use-workspace";
import type { WorkspaceInvitation, InvitationsSettingsProps } from "@/types/workspace-settings";

export function InvitationsSettings({ invitations, organizationId }: InvitationsSettingsProps) {
  const { mutate: cancelInvitationMutation, isPending: isCancelPending } = useCancelInvitation();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<WorkspaceInvitation | null>(null);

  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");

  function handleCancel() {
    if (!cancelTarget) return;

    cancelInvitationMutation(cancelTarget.id, {
      onSuccess: () => setCancelTarget(null),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Invitations</h2>
          <p className="text-sm text-muted-foreground">
            {pendingInvitations.length} pending{" "}
            {pendingInvitations.length === 1 ? "invite" : "invites"}.
          </p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <Plus className="mr-1.5 size-3.5" />
          Invite member
        </Button>
      </div>

      {pendingInvitations.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No pending invitations"
          description="Invite team members to collaborate in this workspace."
          action={{ label: "Invite member", onClick: () => setInviteOpen(true) }}
          className="rounded-lg border border-dashed border-border bg-muted/20"
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-14" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="text-sm">{invitation.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {invitation.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(invitation.expiresAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => setCancelTarget(invitation)}
                    >
                      <X className="size-3.5" />
                      <span className="sr-only">Cancel invitation</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        organizationId={organizationId}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel invitation"
        description={
          cancelTarget
            ? `Cancel the invitation sent to ${cancelTarget.email}? They will no longer be able to join using this invitation.`
            : ""
        }
        confirmLabel="Cancel invitation"
        variant="destructive"
        isPending={isCancelPending}
        onConfirm={handleCancel}
      />
    </div>
  );
}

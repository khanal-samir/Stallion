"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteSchema, type InviteForm } from "@workspace/validators/schemas/workspace";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/ui/form";
import { Input } from "@workspace/ui/components/ui/input";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select";
import { SharedDialog } from "@/components/shared/shared-dialog";
import { useInviteMember } from "@/hooks/queries/use-workspace";
import { ASSIGNABLE_WORKSPACE_ROLE } from "@workspace/validators/schemas/common";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  organizationId,
}: InviteMemberDialogProps) {
  const { mutate: inviteMemberMutation, isPending: isInvitePending } = useInviteMember();

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: ASSIGNABLE_WORKSPACE_ROLE.member,
    },
  });

  function onSubmit(data: InviteForm) {
    inviteMemberMutation(
      {
        email: data.email,
        role: data.role,
        organizationId,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <SharedDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Invite member"
      description="Send an invitation to join this workspace."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    {...field}
                    disabled={isInvitePending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isInvitePending}
                >
                  <FormControl>
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ASSIGNABLE_WORKSPACE_ROLE.member} className="cursor-pointer">
                      Member
                    </SelectItem>
                    <SelectItem value={ASSIGNABLE_WORKSPACE_ROLE.admin} className="cursor-pointer">
                      Admin
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isInvitePending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isInvitePending}>
              {isInvitePending ? "Sending..." : "Send invitation"}
            </Button>
          </div>
        </form>
      </Form>
    </SharedDialog>
  );
}

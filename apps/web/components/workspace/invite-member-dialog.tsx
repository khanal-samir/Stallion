"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteSchema, type InviteForm } from "@workspace/validators";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SharedDialog } from "@/components/shared/shared-dialog";
import { useInviteMember } from "@/hooks/queries/use-workspace";

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
  const inviteMember = useInviteMember();

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  function onSubmit(data: InviteForm) {
    inviteMember.mutate(
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
                    disabled={inviteMember.isPending}
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
                  disabled={inviteMember.isPending}
                >
                  <FormControl>
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="member" className="cursor-pointer">
                      Member
                    </SelectItem>
                    <SelectItem value="admin" className="cursor-pointer">
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
              disabled={inviteMember.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMember.isPending}>
              {inviteMember.isPending ? "Sending..." : "Send invitation"}
            </Button>
          </div>
        </form>
      </Form>
    </SharedDialog>
  );
}

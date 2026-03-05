import { openAPI, organization } from "better-auth/plugins";
import { sendEmail } from "./email.js";
import { env } from "@/config/env.config.js";

export const plugins = [
  organization({
    organizationLimit: 2,
    membershipLimit: 10,
    invitationExpiresIn: 60 * 60 * 24 * 7, // invitations expire in 7 days
    cancelPendingInvitationsOnReInvite: true,
    requireEmailVerificationOnInvitation: true, // user email needs to be verified
    schema: {
      session: {
        fields: {
          activeOrganizationId: "activeOrganizationId",
        },
      },
      organization: {
        modelName: "workspaces",
        additionalFields: {
          ownerId: {
            type: "string",
            required: false,
            input: false, // ownerId is set automatically in the beforeCreateOrganization hook
            references: {
              model: "user",
              field: "id",
            },
          },
        },
      },
      member: {
        modelName: "workspaceMembers",
        fields: {
          organizationId: "workspaceId",
          createdAt: "joinedAt",
        },
      },
      invitation: {
        modelName: "workspaceInvites",
        fields: {
          organizationId: "workspaceId",
          inviterId: "createdBy",
        },
      },
    },
    organizationHooks: {
      beforeCreateOrganization: async ({ organization, user }) => ({
        data: {
          ...organization,
          ownerId: user.id,
        },
      }),
    },
    sendInvitationEmail: async ({ id, email, role, organization, inviter }) => {
      const invitationUrl = `${env.WEB_URL}/accept-invitation?id=${encodeURIComponent(id)}`;
      const inviterName = inviter.user.name || inviter.user.email;

      await sendEmail({
        to: email,
        subject: `Invitation to join ${organization.name}`,
        html: `<p>${inviterName} invited you to join ${organization.name} as ${role}.</p><p>Accept your invitation:</p><a href="${invitationUrl}">${invitationUrl}</a>`,
      });
    },
  }),
  openAPI(),
];

import { Resend } from "resend";
import { env } from "@/config/env.config.js";
import { logger } from "@/config/logger.config.js";

const resend = new Resend(env.RESEND_API_KEY);
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  logger.info({ to, subject }, "Sending email");
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error(
      {
        to,
        subject,
        error,
      },
      "Failed to send email",
    );
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

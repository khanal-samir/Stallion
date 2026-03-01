import { Resend } from "resend";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

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
  logger.info("Sending email", { to, subject });
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error("Failed to send email", {
      to,
      subject,
      error,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

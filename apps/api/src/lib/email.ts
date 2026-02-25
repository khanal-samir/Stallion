import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.NODE_ENV === "production"
    ? "noreply@verio.io"
    : "onboarding@resend.dev";


export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

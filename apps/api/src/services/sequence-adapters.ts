import { env } from "@/config/env.config.js";

export type SendSequenceEmailInput = {
  accessToken: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  unsubscribeUrl: string;
};

export type SendSequenceEmailResult = {
  live: boolean;
  gmailMessageId: string;
  gmailThreadId: string;
};

export async function sendSequenceEmail(input: SendSequenceEmailInput): Promise<SendSequenceEmailResult> {
  if (!env.SEQUENCE_LIVE_SEND_ENABLED) {
    const fingerprint = Buffer.from(`${input.fromEmail}:${input.toEmail}:${input.subject}`).toString(
      "base64url",
    );

    return {
      live: false,
      gmailMessageId: `would-send-${fingerprint.slice(0, 32)}`,
      gmailThreadId: `thread-${fingerprint.slice(0, 32)}`,
    };
  }

  const rawMessage = [
    `From: ${input.fromEmail}`,
    `To: ${input.toEmail}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    `${input.body}\n\nUnsubscribe: ${input.unsubscribeUrl}`,
  ].join("\r\n");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ raw: Buffer.from(rawMessage).toString("base64url") }),
  });

  if (!response.ok) {
    throw new Error(`Gmail send failed with status ${response.status}`);
  }

  const body = (await response.json()) as { id?: string; threadId?: string };
  if (!body.id || !body.threadId) {
    throw new Error("Gmail send response did not include message and thread identifiers");
  }

  return {
    live: true,
    gmailMessageId: body.id,
    gmailThreadId: body.threadId,
  };
}

export async function generateEmailContent(prompt: string) {
  if (!env.GROQ_API_KEY) {
    return {
      subject: "Following up",
      body: `Hi,\n\n${prompt.trim()}\n\nBest,`,
    };
  }

  return {
    subject: "Generated outreach",
    body: `Hi,\n\n${prompt.trim()}\n\nBest,`,
  };
}

export async function generateTaskCopy(input: { prompt?: string; personName: string; fallback: string }) {
  const prompt = input.prompt?.trim();
  if (!prompt) {
    return input.fallback;
  }

  return `${prompt}\n\nContact: ${input.personName}`;
}

import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getEnv } from "@/lib/env";
import { getDb } from "@/server/db/client";
import { emailLog, type EmailKind } from "@/server/db/schema";
import { describeError, logger } from "@/server/logger";

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

export interface Mailer {
  send(message: MailMessage): Promise<{ id?: string }>;
}

/** Sends through Resend's HTTP API (production). */
export class ResendMailer implements Mailer {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: MailMessage) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        headers: message.headers,
      }),
    });
    if (!response.ok) {
      // Only the status is kept: error bodies can echo the recipient's address.
      throw new Error(`Resend responded with HTTP ${response.status}`);
    }
    const body = (await response.json()) as { id?: string };
    return { id: body.id };
  }
}

/** Keeps messages in memory so unit and integration tests can inspect them. */
export class MemoryMailer implements Mailer {
  sent: MailMessage[] = [];
  failNext = false;

  async send(message: MailMessage) {
    if (this.failNext) {
      this.failNext = false;
      throw new Error("Simulated mail failure");
    }
    this.sent.push(message);
    return { id: `memory-${this.sent.length}` };
  }

  clear() {
    this.sent = [];
  }
}

/** Appends messages to .e2e/outbox.jsonl so Playwright tests can follow emailed links. */
export class FileMailer implements Mailer {
  constructor(private readonly file: string) {}

  async send(message: MailMessage) {
    await mkdir(path.dirname(this.file), { recursive: true });
    await appendFile(this.file, JSON.stringify({ ...message, at: Date.now() }) + "\n");
    return { id: `file-${Date.now()}` };
  }
}

/** Development fallback: writes the subject and links to the server log instead of sending. */
export class ConsoleMailer implements Mailer {
  async send(message: MailMessage) {
    const links = message.text.match(/https?:\/\/\S+/g) ?? [];
    logger.info({ subject: message.subject, links }, "Email (not sent in development)");
    return { id: `console-${Date.now()}` };
  }
}

export const E2E_OUTBOX = path.join(/*turbopackIgnore: true*/ process.cwd(), ".e2e/outbox.jsonl");

const globalForMail = globalThis as unknown as { __moonlightMailer?: Mailer };

function createMailer(): Mailer {
  const env = getEnv();
  if (env.NODE_ENV === "test") return new MemoryMailer();
  if (env.isE2E) return new FileMailer(E2E_OUTBOX);
  if (env.RESEND_API_KEY) return new ResendMailer(env.RESEND_API_KEY, env.MAIL_FROM);
  return new ConsoleMailer();
}

export function getMailer(): Mailer {
  globalForMail.__moonlightMailer ??= createMailer();
  return globalForMail.__moonlightMailer;
}

export function setMailer(mailer: Mailer): void {
  globalForMail.__moonlightMailer = mailer;
}

/**
 * Sends one email and records the outcome in email_log. Never throws: callers decide what a
 * failure means (a registration still succeeds when its confirmation email fails).
 */
export async function sendEmail(input: {
  kind: EmailKind;
  relatedId?: string;
  message: MailMessage;
}): Promise<{ ok: boolean }> {
  const { kind, relatedId, message } = input;
  try {
    const { id } = await getMailer().send(message);
    await getDb()
      .insert(emailLog)
      .values({ kind, relatedId, toEmail: message.to, status: "sent", providerMessageId: id });
    return { ok: true };
  } catch (error) {
    const reason = describeError(error);
    logger.error({ kind, relatedId, err: reason }, "Email send failed");
    await getDb()
      .insert(emailLog)
      .values({ kind, relatedId, toEmail: message.to, status: "failed", error: reason.slice(0, 500) });
    return { ok: false };
  }
}

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type OutboxMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  at: number;
};

const OUTBOX = path.join(process.cwd(), ".e2e/outbox.jsonl");

/** Emails "sent" by the E2E server (FileMailer). */
export function readOutbox(): OutboxMessage[] {
  if (!existsSync(OUTBOX)) return [];
  return readFileSync(OUTBOX, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as OutboxMessage);
}

export function messagesTo(email: string): OutboxMessage[] {
  return readOutbox().filter((m) => m.to === email.toLowerCase());
}

/** The most recent link to `pathPrefix` in an email to `email`, as a path (no origin). */
export function lastLinkTo(email: string, pathPrefix: string): string | null {
  const messages = messagesTo(email).reverse();
  for (const message of messages) {
    for (const match of message.text.matchAll(/https?:\/\/[^\s)]+/g)) {
      const url = new URL(match[0]);
      if (url.pathname.startsWith(pathPrefix)) return url.pathname + url.search;
    }
  }
  return null;
}

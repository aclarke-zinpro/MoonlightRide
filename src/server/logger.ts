import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "test" ? "silent" : "info"),
  base: { app: "moonlight-ride" },
  redact: {
    paths: [
      "email",
      "phone",
      "password",
      "token",
      "*.email",
      "*.phone",
      "*.password",
      "*.token",
      "to",
      "*.to",
    ],
    censor: "[redacted]",
  },
});

/** Error text safe to log: drops the query parameters (emails, phones, hashes) database errors carry. */
export function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.split(/\nparams:/)[0]!.slice(0, 500);
}

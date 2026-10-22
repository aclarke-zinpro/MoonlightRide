import { z } from "zod";

const DEV_AUTH_SECRET = "development-only-auth-secret-change-me-0000000000";
const DEV_IP_HASH_SECRET = "development-only-ip-hash-secret";

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  E2E: z.string().optional(),
  DATABASE_URL: z.url().optional(),
  AUTH_SECRET: z.string().min(32, { error: "AUTH_SECRET must be at least 32 characters." }).optional(),
  IP_HASH_SECRET: z.string().min(8).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  MAIL_FROM: z.string().min(3).optional(),
  SITE_URL: z.url().default("http://localhost:3000"),
  CRON_SECRET: z.string().min(8).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
});

const REQUIRED_IN_PRODUCTION = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "IP_HASH_SECRET",
  "RESEND_API_KEY",
  "MAIL_FROM",
  "CRON_SECRET",
] as const;

export type Env = {
  NODE_ENV: "development" | "test" | "production";
  DATABASE_URL?: string;
  AUTH_SECRET: string;
  IP_HASH_SECRET: string;
  RESEND_API_KEY?: string;
  MAIL_FROM: string;
  SITE_URL: string;
  CRON_SECRET?: string;
  BLOB_READ_WRITE_TOKEN?: string;
  isE2E: boolean;
  isProduction: boolean;
};

/** Validates configuration. Throws one error listing every problem so deploys fail fast. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  // Treat empty strings (common in .env files) as unset.
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, v]) => v !== undefined && v !== ""),
  );
  const parsed = baseSchema.safeParse(cleaned);
  const problems: string[] = [];
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      problems.push(`${issue.path.join(".")}: ${issue.message}`);
    }
  }

  const data = parsed.success ? parsed.data : undefined;
  const isE2E = cleaned.E2E === "1";
  const isProduction = (data?.NODE_ENV ?? cleaned.NODE_ENV) === "production" && !isE2E;

  if (isProduction) {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!cleaned[key]) problems.push(`${key}: required in production`);
    }
  }

  if (problems.length > 0 || !data) {
    throw new Error(`Invalid environment configuration:\n  - ${problems.join("\n  - ")}`);
  }

  return {
    NODE_ENV: data.NODE_ENV,
    DATABASE_URL: data.DATABASE_URL,
    AUTH_SECRET: data.AUTH_SECRET ?? DEV_AUTH_SECRET,
    IP_HASH_SECRET: data.IP_HASH_SECRET ?? DEV_IP_HASH_SECRET,
    RESEND_API_KEY: data.RESEND_API_KEY,
    MAIL_FROM: data.MAIL_FROM ?? "Moonlight Ride <ride@localhost>",
    SITE_URL: data.SITE_URL.replace(/\/$/, ""),
    CRON_SECRET: data.CRON_SECRET,
    BLOB_READ_WRITE_TOKEN: data.BLOB_READ_WRITE_TOKEN,
    isE2E,
    isProduction,
  };
}

let cached: Env | undefined;

/** Validated environment for the running server (memoized). */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

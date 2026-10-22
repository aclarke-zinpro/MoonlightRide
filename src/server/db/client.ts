import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export const MIGRATIONS_FOLDER = path.join(/*turbopackIgnore: true*/ process.cwd(), "src/server/db/migrations");

/** Where the local PGlite database lives (development and end-to-end tests). */
export function localDataDir(): string {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), getEnv().isE2E ? ".e2e/db" : ".pglite");
}

// Survive hot reloads in development: one database connection per server process.
const globalForDb = globalThis as unknown as { __moonlightDb?: Db };

function createDb(): Db {
  const env = getEnv();
  if (env.DATABASE_URL && !env.isE2E) {
    const client = postgres(env.DATABASE_URL, { max: 5, prepare: false });
    return drizzlePostgres(client, { schema }) as unknown as Db;
  }
  return drizzlePglite(new PGlite(localDataDir()), { schema }) as unknown as Db;
}

export function getDb(): Db {
  globalForDb.__moonlightDb ??= createDb();
  return globalForDb.__moonlightDb;
}

/** Lets tests point every service at an isolated in-memory database. */
export function setDb(db: Db): void {
  globalForDb.__moonlightDb = db;
}

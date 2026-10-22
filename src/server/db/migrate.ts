import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import { localDataDir, MIGRATIONS_FOLDER } from "./client";

/** Applies all pending migrations to the configured database, then closes the connection. */
export async function runMigrations(): Promise<string> {
  const env = getEnv();
  if (env.DATABASE_URL && !env.isE2E) {
    const client = postgres(env.DATABASE_URL, { max: 1 });
    await migratePostgres(drizzlePostgres(client), { migrationsFolder: MIGRATIONS_FOLDER });
    await client.end();
    return "postgres";
  }
  const dir = localDataDir();
  const client = new PGlite(dir);
  await migratePglite(drizzlePglite(client), { migrationsFolder: MIGRATIONS_FOLDER });
  await client.close();
  return dir;
}

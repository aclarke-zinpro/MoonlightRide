import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { MIGRATIONS_FOLDER, setDb, type Db } from "@/server/db/client";
import * as schema from "@/server/db/schema";

/** A fresh in-memory Postgres with every migration applied, wired into getDb(). */
export async function createTestDb(): Promise<Db> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  setDb(db as unknown as Db);
  return db as unknown as Db;
}

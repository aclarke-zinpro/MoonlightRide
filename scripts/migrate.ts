import { runMigrations } from "../src/server/db/migrate";

runMigrations()
  .then((target) => console.log(`Migrations applied (${target}).`))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });

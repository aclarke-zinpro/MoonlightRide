/**
 * Prepares a fresh end-to-end database before the test server starts. Run by Playwright's
 * webServer command (see playwright.config.ts) so the seed and the server never hold the same
 * PGlite directory at once.
 */
import { randomBytes } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { zonedDateTimeToUtc } from "../../src/lib/dates";
import { runMigrations } from "../../src/server/db/migrate";
import { seed } from "../../src/server/db/seed";
import { createOrganizer } from "../../src/server/services/organizer";

export const E2E_DIR = path.join(process.cwd(), ".e2e");

async function main() {
  if (process.env.E2E !== "1") throw new Error("Run with E2E=1");
  rmSync(E2E_DIR, { recursive: true, force: true });
  mkdirSync(E2E_DIR, { recursive: true });

  await runMigrations();

  // The ride is 30 days after the test run, at 6:00 PM Central, so tests never depend on the
  // real 2026 date.
  const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const day = inThirtyDays.toISOString().slice(0, 10);
  await seed({ startsAt: zonedDateTimeToUtc(day, "18:00", "America/Chicago") });

  const organizer = {
    name: "E2E Organizer",
    email: "organizer@e2e.test",
    password: randomBytes(18).toString("base64url"),
  };
  await createOrganizer(organizer);
  writeFileSync(path.join(E2E_DIR, "organizer.json"), JSON.stringify(organizer));
  console.log("E2E database ready.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("E2E setup failed:", error);
    process.exit(1);
  });

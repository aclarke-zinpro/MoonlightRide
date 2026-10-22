import { seed } from "../src/server/db/seed";

seed()
  .then(({ created }) => {
    console.log(created ? "Seeded the 2026 ride." : "The 2026 ride already exists; nothing to do.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });

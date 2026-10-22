import "@testing-library/jest-dom/vitest";

process.env.AUTH_SECRET ??= "test-auth-secret-that-is-at-least-32-characters-long";
process.env.IP_HASH_SECRET ??= "test-ip-hash-secret";
process.env.SITE_URL ??= "http://localhost:3000";
process.env.MAIL_FROM ??= "Moonlight Ride <ride@test.local>";
process.env.CRON_SECRET ??= "test-cron-secret";

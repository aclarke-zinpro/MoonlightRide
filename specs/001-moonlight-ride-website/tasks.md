---

description: "Task list for the Moonlight Ride Website"
---

# Tasks: Moonlight Ride Website

**Input**: Design documents from `specs/001-moonlight-ride-website/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: REQUIRED. Constitution Principle III says every user story has tests that are written
first and observed failing. Principle VI says `npm run verify` (lint, typecheck, `next build`, the
full test suite) must pass before any hand-off. Every test file name or `describe` block carries its
story ID (`US1`...`US5`).

**Organization**: Tasks are grouped by user story so each story can be built, tested, and
demonstrated on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: The user story this task belongs to (US1-US5)
- Paths are relative to the repository root (single Next.js project, see plan.md)

## Conventions every task follows

- Node 22 is installed through fnm. Run commands in a shell where `node -v` prints v22.
- Business rules live in `src/server/services/*`; route files and components stay thin.
- Server actions return the `ActionResult` shape from
  [contracts/server-actions.md](./contracts/server-actions.md) and never throw to the client.
- Error messages are copied verbatim from the contracts.
- E2E tests run against `next build && next start` with `E2E=1`, PGlite stored in `.e2e/db`,
  and the `FileMailer` writing to `.e2e/outbox.jsonl` (Playwright `workers: 1`).
- E2E global setup seeds a current ride edition dated **30 days after the test run**, so tests do
  not depend on the real 2026 ride date.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and tooling

- [X] T001 Scaffold the Next.js app with `npx create-next-app@latest` (TypeScript, ESLint, Tailwind, App Router, `src/` directory, import alias `@/*`, npm) into a temporary folder, then move its files into the repository root, which already holds `.claude/`, `.specify/`, and `specs/`. Pin exact versions in package.json (no `^`) and commit `package-lock.json`. Add `"engines": { "node": ">=22 <23" }` and an `.nvmrc` containing `22`.
- [X] T002 Enable TypeScript strict options in tsconfig.json: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`
- [X] T003 [P] Install runtime dependencies at exact versions: drizzle-orm, @electric-sql/pglite, postgres, zod, next-auth@5 (beta or stable v5), bcryptjs, resend, @react-email/components, react-markdown, rehype-sanitize, remark-gfm, pino, @vercel/blob, slugify (package.json)
- [X] T004 [P] Install dev dependencies at exact versions: drizzle-kit, vitest, @vitejs/plugin-react, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom, @playwright/test, @axe-core/playwright, prettier, eslint-config-prettier, tsx, @types/bcryptjs (package.json)
- [X] T005 [P] Configure ESLint (`next/core-web-vitals`, `next/typescript`, `prettier`; error on `no-console` except in `scripts/`, error on `@typescript-eslint/no-explicit-any`) in eslint.config.mjs, and Prettier in .prettierrc.json
- [X] T006 [P] Configure Vitest with jsdom for `*.test.tsx`, node for `*.test.ts`, `@` alias, and setup file `tests/helpers/setup.ts` (jest-dom matchers) in vitest.config.ts
- [X] T007 [P] Configure Playwright: `testDir: tests/e2e`, `workers: 1`, projects `mobile` (375x812) and `desktop` (1280x800), `globalSetup: tests/e2e/global-setup.ts`, and a `webServer` that runs `npm run build && npm run start` on port 3100 with `E2E=1` in playwright.config.ts
- [X] T008 Add package.json scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test:unit` (`vitest run`), `test:e2e` (`playwright test`), `test` (`npm run test:unit && npm run test:e2e`), `verify` (`npm run lint && npm run typecheck && npm run build && npm test`), `db:generate`, `db:migrate`, `db:seed`, `organizer:create`, `format`
- [X] T009 [P] Create `.env.example` with placeholders only (`DATABASE_URL=`, `AUTH_SECRET=`, `RESEND_API_KEY=`, `MAIL_FROM=`, `SITE_URL=http://localhost:3000`, `CRON_SECRET=`, `BLOB_READ_WRITE_TOKEN=`, `IP_HASH_SECRET=`), and add `.env*.local`, `.e2e/`, `.pglite/`, `public/uploads/`, `playwright-report/`, `test-results/` to .gitignore
- [X] T010 Run `npx playwright install chromium` and confirm `npm run build` succeeds on the untouched scaffold

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Configuration, database, auth, email, security helpers, layout, and design system
shared by every story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for Foundation (write first, see them fail)

- [X] T011 [P] Unit tests for env validation (missing `AUTH_SECRET` throws with a clear message; `DATABASE_URL` optional unless `NODE_ENV=production`) in tests/unit/env.test.ts
- [X] T012 [P] Unit tests for date helpers: `getRidePhase(edition, now)` returns `upcoming` before `starts_at` and `past` from `starts_at + 6 hours`; `daysUntil` is computed in `America/Chicago` (verify across the DST change on 2026-11-01); `formatRideDate` gives "Saturday, October 24, 2026 · 6:00 PM CDT" in tests/unit/dates.test.ts
- [X] T013 [P] Unit tests for token helpers (32-byte base64url token; SHA-256 hash; `verifyToken` uses constant-time compare) in tests/unit/tokens.test.ts
- [X] T014 [P] Unit tests for spam checks (non-empty honeypot `website` is a bot; signed `formTs` younger than 3 s is a bot; tampered `formTs` is a bot) and rate limiting (11th submission per IP per bucket per hour is refused) in tests/unit/spam.test.ts
- [X] T015 [P] Unit tests for the CSV builder (RFC 4180 quoting; cells starting with `= + - @` prefixed with `'`; UTF-8 BOM) in tests/unit/csv.test.ts
- [X] T016 [P] Integration tests for organizer sign-in: correct credentials create a session; wrong password returns "Email or password is incorrect."; after 5 failures in 15 minutes returns "Too many sign-in attempts. Try again in 15 minutes."; `requireOrganizer()` rejects when there is no session, in tests/integration/auth.test.ts

### Implementation for Foundation

- [X] T017 Implement Zod-validated env in src/lib/env.ts (variables per research R13; fail fast at import; `isE2E` flag from `E2E=1`)
- [X] T018 [P] Implement the pino logger with redaction of `email`, `phone`, `password`, `token`, `*.email`, `*.phone` in src/server/logger.ts
- [X] T019 [P] Implement date helpers (`getRidePhase`, `daysUntil`, `formatRideDate`, `formatRideTime`) using `Intl.DateTimeFormat` with the edition's `time_zone` in src/lib/dates.ts
- [X] T020 [P] Implement token helpers (`createToken`, `hashToken`, `verifyToken`) in src/server/security/tokens.ts
- [X] T021 [P] Implement the CSV builder `toCsv(headers, rows)` in src/lib/csv.ts
- [X] T022 Create the Drizzle client in src/server/db/client.ts: PGlite (`.pglite/` dir in development; `.e2e/db` when `E2E=1`; in-memory for Vitest via `createTestDb()`) and postgres-js when `DATABASE_URL` is set; plus drizzle.config.ts
- [X] T023 Define the foundational schema in src/server/db/schema/core.ts: `ride_edition` (fields and rules exactly as in data-model.md, including "year int unique; 2000-2100", "pct_gravel, pct_trail, pct_paved int 0-100; sum = 100" as a CHECK constraint, "capacity int, nullable; null = unlimited; ≥ 1", "is_current boolean; partial unique index where true", `time_zone` default `America/Chicago`); `organizer` ("email citext unique", "password_hash text bcrypt"); `login_attempt`; `rate_limit_event`; `email_log` ("kind enum registration_confirmation | registration_cancelled | subscription_confirm | post_notification", "status enum sent | failed"). Enable the `citext` extension in the first migration.
- [X] T024 Generate and apply the first migration (`npm run db:generate && npm run db:migrate`) into src/server/db/migrations/, and add src/server/db/migrate.ts used by scripts and test helpers
- [X] T025 Create the test DB helper `createTestDb()` (fresh in-memory PGlite with all migrations) and fixtures from the info sheet (2026 edition, organizer) in tests/helpers/db.ts and tests/helpers/fixtures.ts
- [X] T026 Implement the ride edition service `getCurrentEdition()`, `getRegistrationStatus(edition, now)` (derived state exactly as in data-model.md: `open` only when "registration_open && phase = upcoming && active riders < capacity && current waiver approved", with reasons `organizer_closed`, `full`, `past`, `waiver_not_approved`; the rider-count and waiver checks are passed in as functions so US3 can supply them) in src/server/services/ride.ts
- [X] T027 Implement spam and rate-limit helpers (`signFormTimestamp`, `checkSpam(formData)`, `checkRateLimit(bucket, ip)` with 10 per hour, IPs stored as SHA-256 of IP + `IP_HASH_SECRET`) in src/server/security/spam.ts and src/server/security/rate-limit.ts
- [X] T028 Implement the `Mailer` interface plus `ResendMailer`, `MemoryMailer` (Vitest), `FileMailer` (E2E, appends JSON lines to `.e2e/outbox.jsonl`), and `ConsoleMailer` (development: prints subject and links), selected from env; every send writes an `email_log` row, in src/server/email/mailer.ts
- [X] T029 Create the E2E outbox helper `readOutbox()` and `lastLinkTo(email, pathPrefix)` in tests/helpers/outbox.ts
- [X] T030 Implement the organizer service (`createOrganizer` with bcrypt cost 12, `verifyCredentials`, throttling of "5 failures in 15 minutes" by email or IP hash) in src/server/services/organizer.ts
- [X] T031 Configure Auth.js v5 Credentials provider, JWT session (8-hour max age, httpOnly, secure in production, SameSite=Lax) and the `requireOrganizer()` helper in src/auth.ts and src/app/api/auth/[...nextauth]/route.ts
- [X] T032 Build the organizer login page and `signIn` action (generic errors from the contract; `?next=` redirect allowed only to `/admin` paths) in src/app/admin/login/page.tsx and src/features/auth/actions.ts
- [X] T033 Build the admin layout (server-side session check, redirect to `/admin/login?next=…`; navigation to Dashboard, Ride, Route, Registrations, Subscribers, Posts; sign out) and admin `error.tsx` in src/app/admin/layout.tsx and src/app/admin/error.tsx
- [X] T034 Add the organizer CLI (prompts for the password without echoing it, never prints it) in scripts/create-organizer.ts
- [X] T035 [P] Add design tokens from research R10 (`--night #0d0f12`, `--surface #171a1f`, `--text #ece8e1`, `--muted #a9a39a`, `--accent #d9772b`) as a Tailwind 4 `@theme`, plus base styles and visible focus rings, in src/app/globals.css
- [X] T036 [P] Load fonts with `next/font/google` (Playfair Display 700/900 for headings, Inter for body) in src/app/fonts.ts
- [X] T037 [P] Extract the banner artwork from page 1 of the info sheet (`/Users/aclarke/Downloads/Moonlight Ride 2026 Info Sheet.pdf`) into public/images/banner.jpg (2400 px wide), and the page 2 route map into public/images/route-map-2026.png. Use Python with `-I` and PyMuPDF installed into a scratch virtualenv outside the repository.
- [X] T038 [P] Build shared components: `Banner` (artwork with live-text title and star ornament), `Divider` (thin orange rules with a centered star), `Button`, `FormField` (label, hint, error message linked with `aria-describedby`, `aria-invalid`), `Prose` (sanitized Markdown via react-markdown + remark-gfm + rehype-sanitize) in src/components/
- [X] T039 Build the root layout and the public layout (banner, skip link, nav: Home, Route, Register, Updates; footer; `lang="en"`), public `error.tsx`, and `not-found.tsx` in src/app/layout.tsx, src/app/(public)/layout.tsx, src/app/(public)/error.tsx, and src/app/not-found.tsx
- [X] T040 Add security headers (CSP with `frame-src https://ridewithgps.com` and `frame-ancestors 'none'`, nosniff, Referrer-Policy, HSTS in production) and `Cache-Control: no-store` plus `X-Robots-Tag: noindex` for `/admin/*` in next.config.ts
- [X] T041 Write the base seed (2026 edition from the info sheet: Saturday, October 24, 2026, 6:00 PM `America/Chicago`; Carleton Arboretum North Trailhead near Canada Ave and 320th St W, Northfield, just south of the Waterford Historic Bridge; parking notes; intro, why this date, ride prep, route description, and organizer intro text from the info sheet; 15.8 mi; 77/6/17; 305 ft; `rwgps_route_id` `57148740`; `rwgps_event_url` `https://ridewithgps.com/events/502033-moonlight-ridge-2026`; `static_map_image_url` `/images/route-map-2026.png`) in src/server/db/seed.ts
- [X] T042 Write E2E global setup: delete `.e2e/`, migrate, seed the edition with `starts_at` 30 days from now, and create organizer `organizer@e2e.test` with a generated password saved to `.e2e/organizer.json`, in tests/e2e/global-setup.ts
- [X] T043 Run `npm run lint && npm run typecheck && npm run build && npm run test:unit`; all foundation tests (T011-T016) must pass

**Checkpoint**: Foundation ready. User stories can now start.

---

## Phase 3: User Story 1 - Learn about this year's ride (Priority: P1) 🎯 MVP

**Goal**: Home page with all ride details, countdown and past-ride states, and organizer editing
of ride details.

**Independent Test**: Load `/` and see the date, 6:00 PM start, start location, parking, prep
guidance, and route summary without navigating elsewhere.

### Tests for User Story 1 (write first, see them fail)

- [X] T044 [P] [US1] Unit tests for `updateRideEditionSchema` (percentages must sum to 100 with the message "Gravel, trail, and paved must add up to 100%."; `distance_miles > 0`; Markdown fields max lengths per data-model.md) in tests/unit/us1-ride-schema.test.ts
- [X] T045 [P] [US1] Component tests: `RideHero` shows title, formatted date, time, and location with an "Open in Maps" link; `Countdown` shows "N days to go" when upcoming and "This year's ride has happened" when past; `RouteSummary` shows 15.8 miles, 77% gravel, 6% trail, 17% paved, and 305 ft, in tests/unit/us1-home-components.test.tsx
- [X] T046 [P] [US1] Integration test for the `updateRideEdition` action (refused without a session; valid input saves and calls `revalidatePath('/')`, `'/route'`, and `'/register'`; invalid input returns field errors and echoes values) in tests/integration/us1-update-ride.test.ts
- [X] T047 [P] [US1] E2E covering US1 scenarios 1-5: hero content visible in the first screen on mobile and desktop; summary, prep, and parking present; countdown visible; organizer moves the date into the past and the home page shows the past state with an updates call to action; organizer edits the location and the home page shows it; axe finds no serious or critical violations on `/`, in tests/e2e/us1-ride-info.spec.ts

### Implementation for User Story 1

- [X] T048 [US1] Add `updateRideEditionSchema` (Zod; all `ride_edition` field rules quoted in data-model.md) in src/features/ride/schema.ts
- [X] T049 [US1] Add `updateRideEdition` to the ride service (validates, saves the current edition) in src/server/services/ride.ts
- [X] T050 [P] [US1] Build `RideHero`, `Countdown` (client component updating live; server provides the initial value), `RouteSummary`, and `InfoSection` components in src/features/ride/components/
- [X] T051 [US1] Build the home page: hero, countdown or past state (past state shows "This year's ride has happened" and links to the updates sign-up), route summary, why this date, ride prep, parking, organizer intro, and a Register call to action; `export const revalidate = 3600`, in src/app/(public)/page.tsx
- [X] T052 [US1] Implement the `updateRideEdition` server action (`requireOrganizer`, `ActionResult`, `revalidatePath` for `/`, `/route`, `/register`) in src/features/ride/actions.ts
- [X] T053 [US1] Build the organizer ride editor form (all edition fields, date and time inputs interpreted in the edition's time zone, Markdown fields with a preview) in src/app/admin/ride/page.tsx and src/features/ride/components/RideEditorForm.tsx
- [X] T054 [US1] Build the admin dashboard shell with ride date and phase in src/app/admin/page.tsx; later stories add their counts
- [X] T055 [US1] Add page metadata (title, description, Open Graph image from the banner) for the home page in src/app/(public)/page.tsx
- [X] T056 [US1] Run `npm run verify`; all US1 and foundation tests pass

**Checkpoint**: The home page is a working replacement for the info sheet (MVP).

---

## Phase 4: User Story 2 - Explore the route, directions, and stops (Priority: P2)

**Goal**: Route page with the RideWithGPS map, the ordered cue sheet, the stops list, a static
fallback, and organizer management of cues and stops.

**Independent Test**: Open `/route`; the map shows; all 14 cues are in order; the off-road cue is
highlighted; the mile 5.8 detour is labeled optional; 6 stops with miles appear; blocking the map
shows the fallback.

### Tests for User Story 2 (write first, see them fail)

- [X] T057 [P] [US2] Unit tests for the cue and stop schemas ("text 1-500 chars", "mile numeric(4,1) 0 - distance_miles", "name 1-120 chars", "kind enum rest_stop | food_drink | scenic | landmark", "description max 1,000 chars", "alt required when photo set") in tests/unit/us2-route-schema.test.ts
- [X] T058 [P] [US2] Integration tests for the route service and actions (save, delete, and `reorderCues` / `reorderPois` with the full id list; a mismatched list is refused; positions stay unique; organizer only) in tests/integration/us2-route-actions.test.ts
- [X] T059 [P] [US2] Component tests: `CueSheet` renders an ordered list, marks important cues with visible text "Important" (not color alone), and labels detours "Optional"; `StopsList` shows name, mile, kind, and optional badge; `RouteMap` shows the fallback image, message, and event link when the iframe has not loaded in 8 s (fake timers), in tests/unit/us2-route-components.test.tsx
- [X] T060 [P] [US2] E2E covering US2 scenarios 1-5: iframe `src` contains `id=57148740` and has a title; the event link points to the event URL; 14 cues in order; the off-road cue says Important; the mile 5.8 detour says Optional; the 6 seeded stops appear with miles; with `page.route('**/ridewithgps.com/**', r => r.abort())` the fallback image and cue sheet show; an organizer edit to a stop shows on `/route`; axe passes on `/route`, in tests/e2e/us2-route.spec.ts

### Implementation for User Story 2

- [X] T061 [US2] Add the `cue` and `point_of_interest` tables (fields and rules exactly as in data-model.md, including "position int unique per edition", "is_important boolean", "is_optional_detour boolean", "kind enum rest_stop | food_drink | scenic | landmark", "photo_url, photo_alt text, nullable; alt required when photo set" as a CHECK constraint, and cascade delete on `ride_edition_id`) in src/server/db/schema/route.ts, then run `npm run db:generate`
- [X] T062 [US2] Extend the seed with the 14 info-sheet cues in order (flag the "Important: We are going to go off-road here…" cue `is_important`; flag the mile 5.8 4th Ave Cannon River access cue `is_optional_detour`) and 6 stops: Waterford Historic Bridge (landmark, 0), Sciota Town Hall (landmark, 2.5), Cannon River access (scenic, optional, 5.8), Convenience Store at Hwy 56 and 292nd St E (rest_stop, 8.2), R Bar in Randolph (food_drink, optional, 8.7), river beach on Dakota County park land (scenic, 10, "fire if conditions allow"), in src/server/db/seed.ts
- [X] T063 [P] [US2] Add Zod schemas for cues and stops in src/features/route-guide/schema.ts
- [X] T064 [US2] Implement the route service (`listCues`, `listPois`, `saveCue`, `deleteCue`, `reorderCues`, `savePoi`, `deletePoi`, `reorderPois`, with reordering in a transaction) in src/server/services/route.ts
- [X] T065 [P] [US2] Build `RouteMap` (client: lazy iframe `https://ridewithgps.com/embeds?type=route&id=<rwgps_route_id>&sampleGraph=true`, `title` attribute, 8-second fallback to the static image with alt text, message, and event link), `CueSheet`, and `StopsList` in src/features/route-guide/components/
- [X] T066 [US2] Build the route page (map, "Open full route on RideWithGPS" link, cue sheet, stops; the cue sheet renders on the server so it works without JavaScript) in src/app/(public)/route/page.tsx
- [X] T067 [US2] Implement the cue and stop server actions (`requireOrganizer`, revalidate `/route`) in src/features/route-guide/actions.ts
- [X] T068 [US2] Build the organizer route editor (add, edit, and delete cues and stops; move up and down buttons for keyboard-accessible reordering) in src/app/admin/route/page.tsx and src/features/route-guide/components/RouteEditor.tsx
- [X] T069 [US2] Run `npm run verify`; all tests, including US1, pass

**Checkpoint**: US1 and US2 both work independently.

---

## Phase 5: User Story 3 - Register for the ride (Priority: P2)

**Goal**: Free registration with a versioned, organizer-approved waiver; confirmation and cancel
emails; duplicate and capacity rules; the organizer's registrant list and CSV export.

**Independent Test**: Approve the waiver, open registration, register, get the confirmation email,
see the rider in the admin list and CSV, then cancel with the emailed link.

### Tests for User Story 3 (write first, see them fail)

- [X] T070 [P] [US3] Unit tests for `registerSchema` using the exact field rules and messages from contracts/server-actions.md ("Enter your full name.", "Enter an email address like name@example.com.", "Enter a phone number with 7 to 20 digits, or leave it blank.", "Enter the name of someone we can call in an emergency.", "Enter a phone number for your emergency contact.", "Party size must be between 1 and 10 riders.", "You need to accept the waiver to register.") in tests/unit/us3-register-schema.test.ts
- [X] T071 [P] [US3] Integration tests for the registration service and actions: success saves a row and sends a `registration_confirmation` email containing the date, start location, prep reminders, and a cancel link; duplicate active email gets the "already registered" message; closed, full, and past states are refused with their reason; two registrations racing for the last spot cannot both succeed; a stale `waiverVersionId` gets "The waiver was just updated. Please review it and accept again."; a mail failure still succeeds and logs `failed`; cancel sets `cancelled`, sends `registration_cancelled`, and an invalid token gets "This cancellation link is no longer valid."; a cancelled email can register again; spam submissions return success and save nothing, in tests/integration/us3-registration.test.ts
- [X] T072 [P] [US3] Integration tests for the waiver and registration admin actions: saving creates a new unapproved version; opening registration with an unapproved waiver gets "Approve the waiver before opening registration."; capacity below active riders is refused; the CSV export returns 401 without a session and the right headers, columns, and formula guard with one, in tests/integration/us3-admin.test.ts
- [X] T073 [P] [US3] E2E covering US3 scenarios 1-7: organizer approves the waiver and opens registration; a rider submits; confirmation shows; the outbox has the email; an invalid submit shows field errors and keeps values; a duplicate gets the message; the admin list shows the total and the CSV downloads; closing shows the closed message; the cancel link cancels and the total drops; the waiver text is visible and must be checked; axe passes on `/register`, in tests/e2e/us3-registration.spec.ts

### Implementation for User Story 3

- [X] T074 [US3] Add the `waiver_version` and `registration` tables (exactly as in data-model.md: "version int unique per edition, increments on every edit", "body text 50-20,000 chars", "approved_at timestamptz, nullable"; "full_name 2-100 chars", "email citext; valid email, max 254; unique (ride_edition_id, email) where status = active", "phone text, nullable 7-20 chars", "party_size int 1-10", "status enum active | cancelled", `cancel_token_hash`, `cancelled_at`, `anonymized_at`) in src/server/db/schema/registration.ts, then run `npm run db:generate`
- [X] T075 [US3] Extend the seed with placeholder waiver version 1 (unapproved). The text covers assumption of risk for night gravel and off-road riding, required lights, riding at your own pace, a release of the organizer and volunteers, a photo consent note, and a heading "PLACEHOLDER – organizer must review before approving". Add this in src/server/db/seed.ts
- [X] T076 [P] [US3] Add `registerSchema` and the waiver and registration-settings schemas in src/features/registration/schema.ts
- [X] T077 [US3] Implement the waiver service (`getCurrentWaiver`, `saveWaiver` creates a new version, `approveWaiver`) in src/server/services/waiver.ts
- [X] T078 [US3] Implement the registration service (`register` with the capacity check and insert in one serializable transaction, `cancel`, `activeRiderCount` = "sum of party_size where status = active", `listForEdition`, `toCsvRows`) and wire the rider-count and waiver checks into `getRegistrationStatus`, in src/server/services/registration.ts and src/server/services/ride.ts
- [X] T079 [P] [US3] Build the `registration_confirmation` and `registration_cancelled` React Email templates with HTML and plain text, per contracts/emails.md, in src/server/email/templates/
- [X] T080 [US3] Implement the `registerRider` and `cancelRegistration` server actions (spam checks, `ActionResult`, values echoed, emails sent through the mailer) in src/features/registration/actions.ts
- [X] T081 [US3] Build the registration form (client, `useActionState`; fields per contract; honeypot `website` hidden from people and assistive technology; signed `formTs`; full waiver text in a scrollable labeled region; acceptance checkbox; focus moves to an error summary on failure) in src/features/registration/components/RegisterForm.tsx
- [X] T082 [US3] Build the register page (form, or the closed message with its reason) and the cancel page (`/register/cancel/[token]` with a summary and a "Cancel my registration" POST button) in src/app/(public)/register/page.tsx and src/app/(public)/register/cancel/[token]/page.tsx
- [X] T083 [US3] Implement the waiver and registration-settings admin actions (`saveWaiver`, `approveWaiver`, `setRegistrationOpen` with capacity) and add the waiver editor and registration settings to src/app/admin/ride/page.tsx and src/features/registration/admin-actions.ts
- [X] T084 [US3] Build the registrations admin page (table, status filter, total active riders against capacity, failed confirmation emails flagged from `email_log`) and the CSV route handler (`moonlight-ride-<year>-registrations.csv`, columns per contracts/routes.md) in src/app/admin/registrations/page.tsx and src/app/admin/registrations/export/route.ts
- [X] T085 [US3] Add the registered-rider count and capacity to the dashboard in src/app/admin/page.tsx
- [X] T086 [US3] Run `npm run verify`; all tests, including US1 and US2, pass

**Checkpoint**: Riders can register and cancel; the organizer sees and exports registrations.

---

## Phase 6: User Story 4 - Sign up for ride updates (Priority: P3)

**Goal**: Double-opt-in mailing list with a footer form on every page, one-click unsubscribe,
emailing a post to subscribers, and the organizer's subscriber list and export.

**Independent Test**: Subscribe, confirm by the emailed link, have the organizer send a post
notification, receive it, unsubscribe, and receive nothing next time.

### Tests for User Story 4 (write first, see them fail)

- [X] T087 [P] [US4] Unit tests for subscriber state transitions ("(new) → pending → active (confirm link) → unsubscribed"; "unsubscribed → pending if the person subscribes again"; confirm tokens expire 7 days after `confirm_sent_at`; resend at most once per 10 minutes) in tests/unit/us4-subscriber-state.test.ts
- [X] T088 [P] [US4] Integration tests for the subscription actions: `subscribe` always returns "Thanks! Check your email to confirm your subscription." for new, pending, and active emails, and sends only when the rules allow; `confirmSubscription` is idempotent and an expired link returns "This confirmation link has expired. Sign up again to get a new one."; `unsubscribe` is idempotent and unknown tokens get the same success; spam is ignored; `POST /api/unsubscribe/[token]` returns 200, in tests/integration/us4-subscriptions.test.ts
- [X] T089 [P] [US4] Integration tests for `notifySubscribers(postId)`: only active subscribers get exactly one email each with the title, summary, link, unsubscribe link, and `List-Unsubscribe` and `List-Unsubscribe-Post` headers; `notified_at` is set; a second call sends nothing; returns `{ sent, failed }`, in tests/integration/us4-notify.test.ts
- [X] T090 [P] [US4] E2E covering US4 scenarios 1-6: the footer form on `/route` submits and shows "check your email"; the outbox confirm link activates the subscriber; the organizer sends a post notification (through a minimal post seeded by E2E setup, so US5 is not required) and the subscriber gets it; the unsubscribe page button removes them; resubmitting an active email shows the same neutral message; the admin subscribers page shows the count and the CSV downloads, in tests/e2e/us4-subscriptions.spec.ts

### Implementation for User Story 4

- [X] T091 [US4] Add the `subscriber` table ("email citext unique", "status enum pending | active | unsubscribed", `confirm_token_hash`, `confirm_sent_at`, `confirmed_at`, `unsubscribe_token_hash`, `unsubscribed_at`) in src/server/db/schema/subscriber.ts. If US5 has not run yet, also add a minimal `post` table holding only the fields `notifySubscribers` needs (`title`, `slug`, `summary`, `notified_at`, `status`); US5 later adds the rest. Run `npm run db:generate`.
- [X] T092 [P] [US4] Add `subscribeSchema` in src/features/subscriptions/schema.ts
- [X] T093 [US4] Implement the subscription service (`subscribe`, `confirm`, `unsubscribe`, `listSubscribers`, `activeCount`, `notifySubscribers(postId)` sending through the mailer in batches of 100) in src/server/services/subscription.ts
- [X] T094 [P] [US4] Build the `subscription_confirm` and `post_notification` React Email templates per contracts/emails.md in src/server/email/templates/
- [X] T095 [US4] Implement the `subscribe`, `confirmSubscription`, and `unsubscribe` server actions in src/features/subscriptions/actions.ts, and the one-click handler in src/app/api/unsubscribe/[token]/route.ts
- [X] T096 [US4] Build the `SubscribeForm` (honeypot, signed timestamp, `aria-live` status message) and add it to the public layout footer and the home page's past-ride state, in src/features/subscriptions/components/SubscribeForm.tsx, src/app/(public)/layout.tsx, and src/app/(public)/page.tsx
- [X] T097 [US4] Build the confirm page and the unsubscribe page (POST button, then a confirmation) in src/app/(public)/subscribe/confirm/[token]/page.tsx and src/app/(public)/unsubscribe/[token]/page.tsx
- [X] T098 [US4] Build the subscribers admin page (active count, list, status filter) and its CSV export (Email, Status, Confirmed At) in src/app/admin/subscribers/page.tsx and src/app/admin/subscribers/export/route.ts
- [X] T099 [US4] Add the active subscriber count to the dashboard in src/app/admin/page.tsx
- [X] T100 [US4] Run `npm run verify`; all tests, including US1-US3, pass

**Checkpoint**: The mailing list works end to end.

---

## Phase 7: User Story 5 - Read and publish ride updates (Priority: P3)

**Goal**: The organizer writes, previews, publishes, and unpublishes posts, optionally emailing
subscribers; visitors read a paginated Updates page and individual posts; the home page shows the
latest headline.

**Independent Test**: Sign in, publish a post, see it first on `/updates`, on its own page, and as
the home headline; a draft is never visible when signed out.

### Tests for User Story 5 (write first, see them fail)

- [X] T101 [P] [US5] Unit tests for `postSchema` ("title 3-150 chars", "summary max 300 chars", "body 1-50,000 chars", "alt required when image set (1-200 chars)", cover image "max 5 MB, jpeg/png/webp") and `slugify` (lowercase, hyphenated, unique suffix on collision) in tests/unit/us5-post-schema.test.ts
- [X] T102 [P] [US5] Unit test that `Prose` strips `<script>`, `onerror=` attributes, and `javascript:` links from Markdown in tests/unit/us5-markdown.test.tsx
- [X] T103 [P] [US5] Integration tests for the post actions: `savePost` saves a draft and a slug collision gets "Another post already uses this web address. Choose a different one."; `publishPost` sets `published_at` once and revalidates `/`, `/updates`, `/updates/[slug]`; `publishPost` with `notifySubscribers` calls `notifySubscribers` once and a re-publish returns "Subscribers were already emailed about this post."; `unpublishPost` returns the post to draft; `deletePost` is refused for posts that were ever published; every action is refused without a session, in tests/integration/us5-posts.test.ts
- [X] T104 [P] [US5] E2E covering US5 scenarios 1-5: signed out, `/admin/posts` redirects to login; the organizer creates a draft, and its URL is 404 when signed out; publishing puts it first on `/updates`, on `/updates/<slug>`, and as the home headline; editing changes the public view; unpublishing hides it; with 11 published posts, page 1 shows 10 and page 2 shows 1; `?page=99` is 404; axe passes on `/updates` and a post page, in tests/e2e/us5-blog.spec.ts

### Implementation for User Story 5

- [X] T105 [US5] Add (or complete, if US4 added a minimal version) the `post` table exactly as in data-model.md ("title text 3-150 chars", "slug text unique", "summary text max 300 chars", "body text (Markdown) 1-50,000 chars", "cover_image_url, cover_image_alt text, nullable", "status enum draft | published", `published_at`, "notified_at timestamptz, nullable; set when emailed to subscribers; never sent twice", `author_id` FK to organizer) in src/server/db/schema/post.ts, then run `npm run db:generate`
- [X] T106 [P] [US5] Add `postSchema` and `slugify` in src/features/posts/schema.ts and src/lib/slug.ts
- [X] T107 [P] [US5] Implement the `Storage` adapter (Vercel Blob in production; `public/uploads/` in development and E2E; checks type and size) in src/server/storage/index.ts
- [X] T108 [US5] Implement the post service (`savePost`, `publishPost`, `unpublishPost`, `deletePost`, `listPublished(page, 10)`, `getPublishedBySlug`, `getLatestPublished`); `publishPost` calls `notifySubscribers` from src/server/services/subscription.ts when that module exists and is asked to, in src/server/services/post.ts
- [X] T109 [US5] Implement the post server actions (`requireOrganizer`, `ActionResult`, `revalidatePath`) in src/features/posts/actions.ts
- [X] T110 [US5] Build the post editor (title, slug, summary, Markdown body with Write and Preview tabs, cover image upload with required alt, Save draft, Publish with an "Email subscribers" checkbox that is unchecked by default and disabled with a note when `notified_at` is set, Unpublish, Delete draft) in src/app/admin/posts/page.tsx, src/app/admin/posts/new/page.tsx, src/app/admin/posts/[id]/page.tsx, and src/features/posts/components/PostEditor.tsx
- [X] T111 [US5] Build the Updates list (newest first, 10 per page, `?page=N`, 404 when out of range) and the post page (title, date, cover image with alt, `Prose` body, 404 for drafts and unknown slugs, metadata and Open Graph image) in src/app/(public)/updates/page.tsx and src/app/(public)/updates/[slug]/page.tsx
- [X] T112 [US5] Add the latest post headline and link to the home page (FR-026) in src/app/(public)/page.tsx
- [X] T113 [US5] Add the draft count to the dashboard in src/app/admin/page.tsx
- [X] T114 [US5] Run `npm run verify`; all tests, including US1-US4, pass

**Checkpoint**: All five user stories work independently.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T115 [P] Unit and integration tests for the retention job (registrations anonymized 12 months after their ride date, personal fields nulled and party size and year kept; pending subscribers older than 30 days deleted; `email_log.to_email` nulled; old `login_attempt` and `rate_limit_event` rows purged; the endpoint returns 401 without `Bearer $CRON_SECRET`) in tests/integration/retention.test.ts
- [X] T116 Implement the retention service and cron route in src/server/services/retention.ts and src/app/api/cron/retention/route.ts, and add the daily schedule to vercel.json
- [X] T117 [P] E2E cross-page accessibility and responsiveness sweep: axe on every public page in both projects; keyboard-only registration; no horizontal scroll at 320 px, in tests/e2e/a11y.spec.ts
- [X] T118 [P] Add `robots.ts` (disallow `/admin`) and `sitemap.ts` (public pages and published posts) in src/app/robots.ts and src/app/sitemap.ts
- [X] T119 [P] Write README.md (what the site is; prerequisites including Node 22 through fnm; setup, run, and verify commands from quickstart.md; environment variables; how to create the organizer; deploying to Vercel and verifying the Resend domain; the yearly checklist for a new ride: new edition, cues and stops, waiver review and approval, open registration)
- [X] T120 Review the code for leftover `console.log`, `any`, and TODOs without a reason; check that logs carry no personal data; confirm business logic is not inside components
- [X] T121 Walk through every scenario in quickstart.md against `npm run dev` and fix any gaps
- [X] T122 Final gate: run `npm run verify` from a clean checkout (`rm -rf node_modules .next .e2e && npm ci`) and record the lint, typecheck, build, and test pass and fail counts for the hand-off report

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup and blocks every user story.
- **US1 (Phase 3)**: depends only on Foundational. This is the MVP.
- **US2 (Phase 4)**, **US3 (Phase 5)**, **US4 (Phase 6)**, **US5 (Phase 7)**: each depends only on
  Foundational.
- **Polish (Phase 8)**: after the stories you plan to ship.

### User Story Dependencies

- US1: none.
- US2: none. It adds its own tables.
- US3: none. It completes `getRegistrationStatus` with real rider-count and waiver checks.
- US4: none for its own scenarios. If built before US5, it adds a minimal `post` table so
  `notifySubscribers` can be tested.
- US5: none. The "Email subscribers" option calls US4's `notifySubscribers` when US4 exists; without
  US4 the checkbox is hidden.
- Shared files that later stories append to (the seed, `src/app/admin/page.tsx`, `src/app/(public)/page.tsx`, `src/app/(public)/layout.tsx`, `src/app/admin/ride/page.tsx`) mean stories touching them should not be edited at the same moment.

### Within Each Story

Tests first, and they must fail → schema → service → actions → UI → `npm run verify`.

### Parallel Opportunities

- Setup: T003, T004, T005, T006, T007, T009.
- Foundation tests T011-T016 together; then T018-T021 and T035-T038 together.
- In each story, every task marked [P] in the Tests group can run together, and then the [P]
  component and template tasks.
- After Foundational, US2, US3, US4, and US5 can be built by different people at the same time,
  as long as edits to the shared files listed above are coordinated.

---

## Parallel Example: User Story 3

```bash
# Tests together (all should fail at first):
Task: "T070 Unit tests for registerSchema in tests/unit/us3-register-schema.test.ts"
Task: "T071 Integration tests for registration in tests/integration/us3-registration.test.ts"
Task: "T072 Integration tests for waiver and admin in tests/integration/us3-admin.test.ts"
Task: "T073 E2E for US3 in tests/e2e/us3-registration.spec.ts"

# After the schema (T074) and service (T077-T078):
Task: "T076 registerSchema in src/features/registration/schema.ts"
Task: "T079 Email templates in src/server/email/templates/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup, then Phase 2 Foundational.
2. Phase 3 (US1): the home page replaces the PDF info sheet.
3. **Stop and validate**: `npm run verify` passes, then demo.

### Incremental Delivery

1. Add US2 (route), then verify and demo.
2. Add US3 (registration), then verify and demo. Registration is ready once the organizer approves
   the waiver.
3. Add US4 (updates list), then verify and demo.
4. Add US5 (blog), then verify and demo.
5. Polish, then the final gate (T122).

Each increment ends with a full `npm run verify` (Constitution Principle VI), not just that story's
tests.

---

## Notes

- [P] tasks = different files, no dependency on an incomplete task.
- Story labels trace every task to spec.md; test files carry the same IDs.
- Never weaken a failing test to make it pass; fix the code or raise the spec question.
- The folder is not a git repository yet; if version control is set up, commit after each
  checkpoint.

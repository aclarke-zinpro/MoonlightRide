# Research: Moonlight Ride Website

All Technical Context items are resolved; no NEEDS CLARIFICATION remain.

## R1. Framework and rendering

- **Decision**: Next.js App Router with TypeScript strict. Public pages are Server Components,
  statically rendered and revalidated on demand (`revalidatePath`) when the organizer saves changes.
  Client components only for the countdown, map fallback detection, and form interactivity.
- **Rationale**: Required by the constitution. Static output plus on-demand revalidation serves
  traffic spikes (SC-006) from the CDN and keeps pages fast (SC-005).
- **Alternatives considered**: Fully dynamic rendering (needless DB load); a separate API backend
  (violates Simplicity).

## R2. Database and ORM

- **Decision**: PostgreSQL with Drizzle ORM. Production uses managed Postgres (for example Neon,
  through Vercel). Development and tests use PGlite, an in-process build of Postgres, with the same
  Drizzle schema and migrations.
- **Rationale**: Registrations, subscribers, and posts are relational and need uniqueness
  constraints (one registration per email per year). PGlite gives real Postgres behavior with no
  Docker or local install; this Mac has neither Docker nor Homebrew. Each test file gets a fresh
  database in milliseconds.
- **Alternatives considered**: Prisma (heavier, needs a real Postgres or a different SQLite schema
  for tests); SQLite in production (does not fit serverless hosting); a headless CMS (adds a second
  system and cost for a small site).

## R3. Organizer authentication

- **Decision**: Auth.js v5, Credentials provider (email + password), passwords hashed with bcrypt
  (cost 12), JWT session cookie (httpOnly, secure, SameSite=Lax, 8-hour lifetime). Organizer
  accounts are created only by a CLI script (`scripts/create-organizer.ts`); there is no public
  sign-up. Every admin page (in its layout) and every admin server action checks the session on the
  server.
- **Throttling (FR-028)**: A `login_attempts` table keyed by email and IP; after 5 failures in
  15 minutes, sign-in is refused for 15 minutes with a generic message.
- **Rationale**: Only 1-3 organizers; a password login is the simplest secure option with no
  third-party identity provider. DB-backed throttling avoids Redis.
- **Alternatives considered**: Email magic links (depend on email delivery to sign in);
  Google sign-in (ties the site to one personal account); Clerk (paid, external).

## R4. Transactional email

- **Decision**: A `Mailer` interface with two implementations: `ResendMailer` (production) and
  `MemoryMailer` (dev and tests; captures messages so tests can assert on them and follow links).
  Templates use React Email. Sends are recorded in an `email_log` table with status, so failed
  confirmations are visible to the organizer (spec edge case).
- **Bulk post notifications (FR-022)**: Sent in batches using Resend's batch API from a server
  action; each post stores `notified_at` so it is emailed at most once. Each email includes
  `List-Unsubscribe` and `List-Unsubscribe-Post` headers (one-click unsubscribe) plus a link.
- **Rationale**: Resend has a free tier that covers this volume and simple domain verification.
  The adapter keeps tests offline.
- **Alternatives considered**: SMTP via nodemailer (deliverability setup burden); Mailchimp
  (organizer chose built-in emails, Q3).

## R5. Route map

- **Decision**: Embed RideWithGPS route **57148740** (found through the confirmed event
  `502033-moonlight-ridge-2026`) in an iframe:
  `https://ridewithgps.com/embeds?type=route&id=57148740&sampleGraph=true`, with `title` text for
  screen readers. The cue sheet and stops are stored in the site's own database and always render
  as HTML. A static route image (from the info sheet's page-2 map) shows if the iframe fails to load
  within 8 seconds, plus a link to the event page.
- **Rationale**: Reuses the organizer's existing route (GPS downloads, elevation profile) with no
  map API keys. Keeping the cue sheet in HTML satisfies the "works without the map" requirement
  (FR-008) and accessibility.
- **Alternatives considered**: Leaflet with exported GPX (duplicate route maintenance, tile-provider
  terms); Google Maps (API key and billing).

## R6. Blog content

- **Decision**: Posts are written in Markdown in a textarea with a live preview tab, stored as
  Markdown, and rendered with react-markdown plus rehype-sanitize (no raw HTML). Slugs come from
  titles and are unique. Cover images go through a `Storage` adapter (Vercel Blob in production,
  local disk in development); alt text is required.
- **Rationale**: Markdown is safe to sanitize, simple to test, and needs no heavy editor.
- **Alternatives considered**: Rich text editor such as TipTap (bigger dependency, more to test);
  MDX files in the repo (would need a developer to post, which conflicts with SC-004).

## R7. Spam protection (FR-029)

- **Decision**: Three layers, no puzzles: (1) a hidden honeypot field; (2) a signed timestamp
  rejecting submissions completed in under 3 seconds; (3) per-IP rate limiting in Postgres
  (10 submissions per hour per form). Rejected bots get the normal success message, so they learn
  nothing.
- **Rationale**: Effective for a small event site, accessible, and free.
- **Alternatives considered**: Cloudflare Turnstile (can be added later if SC-008 fails;
  adds a third party); reCAPTCHA (privacy and accessibility costs).

## R8. Tokens for email links

- **Decision**: Random 32-byte tokens (base64url); only a SHA-256 hash is stored. Used for
  subscription confirmation (expires in 7 days), unsubscribe (no expiry), and registration
  cancellation (valid until the ride date). Unsubscribe and cancel take effect from a confirmation
  button (POST), not on a plain GET, so link scanners in email clients cannot trigger them by
  accident; the one-click `List-Unsubscribe-Post` header is the standards-defined exception.
- **Rationale**: A leaked database does not expose working links; GET-safety avoids accidental
  cancellations.

## R9. Dates and time zone

- **Decision**: The ride's start is stored as a UTC timestamp plus the IANA zone
  `America/Chicago` (matches the RideWithGPS event). Countdown and "ride has happened" are computed
  in that zone. Pages showing countdown revalidate at local midnight (`revalidate` of at most one
  hour), and the client component updates the countdown live.
- **Rationale**: Avoids off-by-one-day errors for visitors and server in different zones.

## R10. Look and feel (FR-030, FR-031)

- **Decision**: Design tokens taken from the info sheet:
  - Night background `#0d0f12`, surface `#171a1f`, text `#ece8e1`, muted text `#a9a39a`.
  - Burnt orange accent `#d9772b` for headings and rules (contrast of about 6:1 on the night
    background, which passes AA). Solid buttons use orange with near-black text.
  - Headings: a bold, high-contrast serif (Playfair Display, through `next/font`, self-hosted).
    Body: Inter.
  - Banner: the info sheet artwork (moonlit forest, full moon) as a responsive hero with the
    "Moonlight Ride 2026" title in live text (not baked into the image) for accessibility; thin
    orange rules with a star ornament as a reusable `Divider` component.
- **Rationale**: Matches the organizer's style guide while meeting contrast requirements; the
  dark theme also suits phones used at night.
- **Follow-up**: The organizer will supply high-resolution banner artwork; until then, the
  info-sheet artwork extracted from the PDF is used.

## R11. Data retention (privacy)

- **Decision**: A daily Vercel Cron job calls `/api/cron/retention` (protected by `CRON_SECRET`).
  It anonymizes registrations (removes name, email, phone, emergency contact; keeps party size and
  year for counts) 12 months after their ride date, and deletes pending subscriptions older than
  30 days.
- **Rationale**: Meets the spec's retention assumption without manual work.

## R12. Testing strategy

- **Decision**:
  - Unit (Vitest): services, Zod schemas, date and countdown logic, CSV builder, token and spam
    helpers.
  - Integration (Vitest + PGlite + MemoryMailer): each server action end to end against a real
    schema.
  - E2E (Playwright, against `next build && next start` with PGlite and MemoryMailer): one file per
    user story (`us1-ride-info.spec.ts` ... `us5-blog.spec.ts`), covering every acceptance scenario,
    with axe checks on each public page.
  - `npm run verify` = `lint && typecheck && build && test`, the constitution's Build &
    Verification Gate.
- **Rationale**: Every acceptance scenario maps to at least one test, labeled with its story ID.

## R13. Observability and configuration

- **Decision**: pino JSON logger with redaction of `email`, `phone`, `password`, `token` fields.
  `src/lib/env.ts` validates environment variables with Zod at startup and fails fast.
  Required variables: `DATABASE_URL` (optional in development, where PGlite is used),
  `AUTH_SECRET`, `RESEND_API_KEY` (production), `MAIL_FROM`, `SITE_URL`, `CRON_SECRET`,
  `BLOB_READ_WRITE_TOKEN` (production).

## R14. Local tooling prerequisite

- **Finding**: Node.js is not installed on the development Mac (no Homebrew or Docker either).
- **Decision**: Install Node.js 22 LTS before implementation, either through the official macOS
  installer from nodejs.org (needs an admin password) or a user-level version manager such as
  `fnm`. Nothing else needs to be installed system-wide. Playwright downloads its own browsers.

## Implementation notes (2026-10-22): where the build differs from the decisions above

Recorded during `/speckit-implement`. Each change keeps the original goal and is simpler or
safer on the versions actually installed.

- **R1, rendering.** `create-next-app` installed **Next.js 16.4.2**, which turns on *Cache
  Components* by default. It is turned **off** (`cacheComponents: false`), and the root layout sets
  `dynamic = "force-dynamic"`. Every page reads the database at request time, so `next build` never
  touches the database. This matters because PGlite can't be opened by several build workers at
  once. At this site's traffic (SC-006: 500 visitors an hour), rendering on request is well within
  limits. `revalidatePath` calls are kept so client caches refresh after organizer edits.
- **R2, emails stored lower-case.** Emails are lower-cased before they're stored, so plain `text`
  columns with unique indexes are used instead of the `citext` extension (which PGlite would need
  loaded separately).
- **R3, sessions.** Instead of the Auth.js v5 beta, whose compatibility with Next 16 was uncertain,
  organizer sessions are an HS256-signed JWT in an httpOnly cookie, made with `jose`
  (`src/server/auth/session.ts`). The cookie lasts 8 hours, is SameSite=Lax, and is Secure in
  production, as R3 specifies. Next 16's `proxy.ts` (formerly middleware) redirects signed-out
  visitors on `/admin` pages. The admin layout and every admin action also check the session
  against the database.
- **R4, email.** Templates are plain TypeScript functions that return the HTML and text parts (no
  React Email). `ResendMailer` calls Resend's HTTP API with `fetch` (no SDK). Notifications are
  sent in batches of 100 concurrent requests.
- **R6, cover images.** In development and end-to-end tests, images are stored in `.uploads/` and
  served by `/uploads/[name]`, because files added to `public/` after a build aren't served.
  Production uses Vercel Blob as planned. The server-action body limit is raised to 6 MB for the
  5 MB images.
- **R7, rate limits.** The limit is 10 submissions per hour, except when `E2E=1`, where it is 1,000.
  The end-to-end suite submits many forms from one address; the real limit has unit tests.
- **R8, unsubscribe tokens.** The unsubscribe token is an HMAC of the subscriber id (keyed with
  `AUTH_SECRET`), so every email ever sent carries a working link. Only its SHA-256 hash is stored.
  Confirmation and cancellation tokens are random, as planned.
- **R10, banner.** The info sheet's banner artwork has "Moonlight Ride 2026" baked into the image.
  The site therefore draws the banner in CSS (night gradient, glowing moon, rules with a star) with
  live-text titles, which stay accessible and update each year. The artwork itself is the Open
  Graph image (`public/images/og-2026.jpg`). Fonts are Playfair Display and Inter.
- **Logging.** `describeError()` strips query parameters from database errors before they are
  logged, so emails, phones, and password hashes never reach logs.

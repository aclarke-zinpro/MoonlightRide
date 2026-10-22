# Quickstart: Moonlight Ride Website

How to run the site locally and prove each user story works. Behavior details live in
[contracts/](./contracts/) and [data-model.md](./data-model.md).

## Prerequisites

- **Node.js 22 LTS**, installed on this Mac with `fnm` (open a new terminal; `node -v` prints v22).
- No database, Docker, or email account is needed locally: development and tests use PGlite
  (in-process Postgres) and an in-memory mailer.

## Setup

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run db:migrate && npm run db:seed
```

```bash
npm run organizer:create -- --email you@example.com --name "Adam Clarke"
```

Before registration can open, sign in at `/admin/ride`, review the placeholder waiver, and approve
it.

The seed loads the 2026 ride, cue sheet, stops, and placeholder waiver from the info sheet. The
organizer script prompts for a password and never prints it.

## Run

```bash
npm run dev
```

Open http://localhost:3000. Without a `RESEND_API_KEY`, emails are not delivered: the server log
shows each email's subject and links instead.

## Verify (Constitution Principle VI: required before every hand-off)

```bash
npm run verify
```

This runs, in order: ESLint, `tsc --noEmit`, `next build`, Vitest (unit and integration), and
Playwright (end to end and accessibility). Every step must pass. Run one story's tests with, for
example, `npx playwright test us3`.

## Validation scenarios (one per user story)

| Story | Scenario | Expected |
|-------|----------|----------|
| US1 | Open `/` on a 375 px wide screen | Title, "Saturday, October 24, 2026 · 6:00 PM", Carleton Arboretum North Trailhead, and countdown visible without scrolling; route summary, prep, and parking below |
| US1 | Set the ride date in the past in `/admin/ride` | Home shows "This year's ride has happened" and the updates sign-up |
| US2 | Open `/route` | Map loads; 14 cues in order; off-road cue highlighted; mile 5.8 detour marked optional; 6 stops with miles |
| US2 | Block `ridewithgps.com` (Playwright route abort) | Static map image, explanation, and event link appear; cue sheet still visible |
| US3 | Approve the waiver, open registration, submit a valid form | Confirmation shown; one email in the terminal with details and cancel link; row in `/admin/registrations`; CSV download works |
| US3 | Submit again with the same email | "already registered" message, no duplicate |
| US3 | Follow the cancel link and confirm | Status cancelled; rider total goes down |
| US4 | Submit an email in the footer form, then open the confirm link | "Check your email", then the subscriber is active in `/admin/subscribers` |
| US4 | Publish a post with "Email subscribers" checked; then open its unsubscribe link | Active subscriber gets one email; after unsubscribing, the next notified post sends nothing to them |
| US5 | Visit `/admin` while signed out | Redirect to `/admin/login` |
| US5 | Create a draft, open its address signed out | 404 |
| US5 | Publish the post | First on `/updates` and headline on `/` |

## Deploying (for later)

Vercel project with environment variables from `.env.example` (`DATABASE_URL` for managed Postgres,
`AUTH_SECRET`, `RESEND_API_KEY`, `MAIL_FROM`, `SITE_URL`, `CRON_SECRET`,
`BLOB_READ_WRITE_TOKEN`). The sending domain must be verified in Resend before emails will deliver.

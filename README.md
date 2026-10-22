# Moonlight Ride

The website for the Moonlight Ride, a casual fall gravel ride by the light of the full moon along
the Cannon River near Northfield, Minnesota.

- **Riders** see the ride details, the route map with turn-by-turn directions and stops, can
  register (free, with a waiver), sign up for email updates, and read update posts.
- **Organizers** sign in at `/admin` to edit the ride, route, and waiver, open or close
  registration, see and export registrations and subscribers, and write posts (optionally
  emailing them to subscribers).

Built with Next.js (App Router) and TypeScript. Specs and design decisions live in
[`specs/001-moonlight-ride-website/`](specs/001-moonlight-ride-website/); project rules are in
[`.specify/memory/constitution.md`](.specify/memory/constitution.md).

## Prerequisites

- **Node.js 22** (see `.nvmrc`). On this Mac it is installed with [fnm](https://github.com/Schniz/fnm):
  open a new terminal and `node -v` should print `v22.x`.
- Nothing else. Locally the database is [PGlite](https://pglite.dev) (Postgres running inside
  Node, stored in `.pglite/`), and emails are printed to the terminal instead of being sent.

## Set up

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
npm run organizer:create -- --email you@example.com --name "Your Name"
```

The seed loads the 2026 ride, directions, and stops from the info sheet, plus a **placeholder
waiver that must be reviewed and approved** before registration can open. The organizer script
asks for a password (at least 12 characters) and never prints it.

## Run

```bash
npm run dev
```

Open http://localhost:3000, and http://localhost:3000/admin to sign in.

## Verify (required before every hand-off)

```bash
npm run verify
```

Runs ESLint, the TypeScript check, `next build`, the unit and integration tests (Vitest), and the
end-to-end tests (Playwright, which builds and starts its own server on port 3100 with a fresh
database). Every step must pass. Useful pieces:

| Command | What it does |
|---------|--------------|
| `npm run test:unit` | Vitest unit and integration tests |
| `npm run test:e2e` | Playwright end-to-end and accessibility tests |
| `npx playwright test us3` | One user story's browser tests |
| `npm run db:generate` | Create a migration after changing `src/server/db/schema/*` |

Test files are named after the user story they cover (`us1-…` to `us5-…`).

## Configuration

All settings are environment variables, validated when the server starts (it refuses to start in
production if any required value is missing). See [`.env.example`](.env.example).

| Variable | Needed in production | Purpose |
|----------|---------------------|---------|
| `DATABASE_URL` | Yes | Postgres connection string (e.g. Neon) |
| `AUTH_SECRET` | Yes | Signs organizer sessions (32+ random characters) |
| `IP_HASH_SECRET` | Yes | Hashes visitor IPs for rate limiting |
| `RESEND_API_KEY` | Yes | Sends email through [Resend](https://resend.com) |
| `MAIL_FROM` | Yes | Sender, e.g. `Moonlight Ride <ride@yourdomain.com>` |
| `SITE_URL` | Yes | Public URL used in email links |
| `CRON_SECRET` | Yes | Protects the daily data-retention job |
| `BLOB_READ_WRITE_TOKEN` | For cover images | Vercel Blob storage for post images |

## Deploy (Vercel)

1. Create a Vercel project from this repository and add a Postgres database (for example Neon)
   so `DATABASE_URL` is set.
2. Add the environment variables above.
3. Run migrations against production once: `DATABASE_URL=… npm run db:migrate`, then
   `npm run db:seed` and `npm run organizer:create -- …`.
4. Verify your sending domain in Resend before expecting emails to arrive.
5. `vercel.json` schedules `/api/cron/retention` daily. It removes riders' personal details 12
   months after their ride and clears unconfirmed sign-ups after 30 days.

## Each year's checklist

1. **Ride details** (`/admin/ride`): update the title, date, time, and any text. Riders see
   changes immediately.
2. **Route** (`/admin/route`): update directions and stops; update the RideWithGPS route id and
   event link if the route changed.
3. **Waiver**: review it, save any changes, and **approve** it.
4. **Registration**: tick "Registration is open" and set a capacity if you want one.
5. **Posts**: publish an announcement and tick "Email this post to subscribers".

## Project layout

```text
src/app/            routes: (public) pages, admin/ (organizer area), api/ (one-click unsubscribe, cron)
src/features/       one folder per user story: schema, server actions, components
src/server/         database schema and migrations, services (business rules), email, security
src/components/     shared UI (banner, buttons, form fields, Markdown)
tests/              unit/, integration/ (Vitest + PGlite), e2e/ (Playwright)
```

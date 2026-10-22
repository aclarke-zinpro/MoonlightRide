# Implementation Plan: Moonlight Ride Website

**Branch**: `001-moonlight-ride-website` | **Date**: 2026-10-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-moonlight-ride-website/spec.md`

## Summary

A public website for the annual Moonlight Ride (ride info, route map with cue sheet and stops,
free registration with a versioned waiver, double-opt-in update emails, and a blog), plus a
signed-in organizer area to manage all of it. Built as a single Next.js (App Router, TypeScript)
application: React Server Components render public pages from a Postgres database; Server Actions
handle forms; Zod validates every boundary; transactional email goes through a pluggable mail
adapter (Resend in production, in-memory in tests). The route map embeds the organizer's existing
RideWithGPS route (id 57148740) with a static-image fallback. Visual design follows the 2026 info
sheet (dark night banner, burnt-orange serif headings). See [research.md](./research.md) for the
reasoning behind each choice.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 22 LTS

**Primary Dependencies**: Next.js 16.4.2 (App Router), React 19.3, Tailwind CSS 4, Drizzle ORM,
Zod 4, `jose` signed-cookie sessions with bcryptjs, Resend (HTTP API), react-markdown with
rehype-sanitize, pino. See research.md "Implementation notes" for changes from the original plan.

**Storage**: PostgreSQL (production: managed Postgres such as Neon); local development and tests use
PGlite (in-process Postgres) through the same Drizzle schema, so no Docker is needed. Cover images
stored via a storage adapter (Vercel Blob in production, local `public/uploads` in development).

**Testing**: Vitest + React Testing Library (unit/component/integration against PGlite),
Playwright (end-to-end per user story), @axe-core/playwright (accessibility, SC-007).
`npm test` runs everything.

**Target Platform**: Web; deployed to Vercel (Node runtime). Modern evergreen browsers, mobile-first.

**Project Type**: Web application (single Next.js project, full stack)

**Performance Goals**: Main content visible in under 3 s on a typical mobile connection (SC-005);
500 visitors per hour after an announcement (SC-006). Public pages are statically rendered and
revalidated on organizer edits, so traffic spikes hit the CDN rather than the database.

**Constraints**: WCAG 2.2 AA; no CAPTCHA puzzles; cue sheet must render without the map; personal
data visible only to organizers and deleted or anonymized 12 months after the ride; no payments.

**Scale/Scope**: One ride per year, about 50-300 registrants, a few hundred subscribers, tens of
posts; 1-3 organizer accounts; about 8 public routes and 8 admin routes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-Driven | Spec exists with stories, acceptance scenarios, success criteria; all clarifications resolved | PASS |
| II. Simplicity | Single Next.js project; no separate backend, no Redis, no Docker; each dependency justified in research.md | PASS |
| III. Test-First | Every user story (US1-US5) gets Vitest + Playwright tests tagged with its ID, written before implementation; organizer auth is covered under US5 | PASS (enforced in tasks) |
| IV. Security & Privacy | Secrets via env (validated at startup, `.env.example` placeholders); Zod on all inputs; server-side auth on every admin action; personal data retention job; hashed passwords; throttled sign-in | PASS |
| V. Accessible UX | WCAG 2.2 AA checked automatically with axe on every public page; `error.tsx` per segment; consistent design tokens from info sheet | PASS |
| VI. Build & Verification Gate | `npm run verify` = lint + typecheck + `next build` + full test suite; required before hand-off | PASS (blocked locally until Node.js is installed; see quickstart) |
| VII. Enterprise Standards | strict TS, ESLint + Prettier, pino structured logging, env validation fail-fast, feature-organized code, business logic in `src/server/`, not in components | PASS |
| Tech: Next.js App Router + TS | Yes | PASS |

No violations, so Complexity Tracking is empty.

**Post-design re-check (after Phase 1)**: PASS. The design adds no separate services. Every
dependency in Technical Context is justified in research.md (R1-R13). The contracts define
field-level validation and user-facing error messages (Principles IV and V). Every quickstart
scenario maps to a US1-US5 test. The only open risk is that Node.js is not yet installed (R14),
which blocks the Build & Verification Gate until it is.

## Project Structure

### Documentation (this feature)

```text
specs/001-moonlight-ride-website/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── routes.md          # public and admin pages, route handlers
│   ├── server-actions.md  # form actions: inputs, validation, results
│   └── emails.md          # transactional email contracts
└── tasks.md               # created by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Home: ride info, countdown, latest post (US1)
│   │   ├── route/page.tsx            # Map, cue sheet, stops (US2)
│   │   ├── register/page.tsx         # Registration form (US3)
│   │   ├── register/cancel/[token]/page.tsx
│   │   ├── subscribe/confirm/[token]/page.tsx   # (US4)
│   │   ├── unsubscribe/[token]/page.tsx
│   │   ├── updates/page.tsx          # Blog list (US5)
│   │   ├── updates/[slug]/page.tsx
│   │   ├── layout.tsx                # banner, nav, footer subscribe form
│   │   └── error.tsx
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── page.tsx                  # dashboard: counts
│   │   ├── ride/page.tsx             # edit ride edition, waiver
│   │   ├── route/page.tsx            # cues and stops
│   │   ├── registrations/page.tsx
│   │   ├── registrations/export/route.ts   # CSV
│   │   ├── subscribers/page.tsx
│   │   ├── subscribers/export/route.ts     # CSV
│   │   ├── posts/page.tsx, posts/new/page.tsx, posts/[id]/page.tsx
│   │   ├── layout.tsx                # requires session
│   │   └── error.tsx
│   ├── api/auth/[...nextauth]/route.ts
│   ├── api/cron/retention/route.ts   # 12-month data purge (secret-protected)
│   ├── layout.tsx, globals.css, not-found.tsx
├── components/                       # presentational UI only (Banner, Countdown, CueSheet...)
├── features/                         # one folder per story: actions.ts + schema.ts + UI
│   ├── ride/  route-guide/  registration/  subscriptions/  posts/  auth/
├── server/
│   ├── db/ (schema.ts, client.ts, migrations/, seed.ts)
│   ├── services/ (ride, route, registration, subscription, post, organizer, retention)
│   ├── email/ (mailer.ts adapter, templates/)
│   ├── storage/ (adapter for cover images)
│   ├── security/ (rate-limit.ts, spam.ts, tokens.ts)
│   └── logger.ts
├── lib/ (env.ts, dates.ts, csv.ts, markdown.ts)
└── auth.ts                           # Auth.js config
tests/
├── unit/          # services, schemas, dates, csv (Vitest)
├── integration/   # server actions against PGlite (Vitest)
├── e2e/           # one spec file per user story: us1-ride-info.spec.ts ... (Playwright)
└── helpers/       # test db, fake mailer, fixtures from info sheet
scripts/
└── create-organizer.ts               # CLI to create the organizer account
```

**Structure Decision**: A single Next.js project. Routes stay thin; each `features/<story>` folder
owns its schema and server actions; all business rules live in `src/server/services` so they can
be unit-tested without React (Principle VII). Test files carry the story ID (`US1`...`US5`) to meet
Principle III.

## Complexity Tracking

No constitution violations to justify.

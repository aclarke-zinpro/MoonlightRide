# Contract: Routes

Every public page shares a layout with: the banner, navigation (Home, Route, Register, Updates),
and a footer with the updates sign-up form (FR-019). Every route segment has an `error.tsx`
boundary and the app has a `not-found.tsx`.

## Public pages

| Path | Story | Renders | Notes |
|------|-------|---------|-------|
| `/` | US1, US5 | Title, date, start time, start location with "Open in Maps" link, countdown or "ride has happened" state, route summary, why this date, ride prep, parking, organizer intro, latest post headline, Register call to action | Static; revalidated on edits and at least hourly |
| `/route` | US2 | RideWithGPS iframe (`title="Route map for Moonlight Ride <year>"`), link to the event, ordered cue sheet (important cues highlighted, optional detours labeled), stops list with mile, kind, description, optional flag | Fallback image and message if the iframe has not loaded after 8 s |
| `/register` | US3 | Form (see `registerRider`) with the full waiver text and acceptance checkbox; or a closed message with its reason | Dynamic (capacity can change) |
| `/register/cancel/[token]` | US3 | Registration summary and "Cancel my registration" button (POST via `cancelRegistration`) | Invalid or used token: neutral "link no longer valid" page |
| `/subscribe/confirm/[token]` | US4 | Confirms the subscription on load (idempotent: pending to active only) and shows success | Expired: offer to re-subscribe |
| `/unsubscribe/[token]` | US4 | "Unsubscribe" button (POST via `unsubscribe`) then a confirmation | |
| `/updates` | US5 | Published posts, newest first, 10 per page (`?page=N`) | Out-of-range page returns 404 |
| `/updates/[slug]` | US5 | Post with title, date, cover image, sanitized body | Drafts and unknown slugs return 404 for visitors |

## Organizer pages (all require a session; otherwise redirect to `/admin/login?next=…`)

| Path | Story | Purpose |
|------|-------|---------|
| `/admin/login` | US5 (auth) | Email and password; generic error; throttled (FR-028) |
| `/admin` | all | Dashboard: registered riders and capacity, active subscribers, failed emails, drafts |
| `/admin/ride` | US1, US3 | Edit current edition; open or close registration; capacity; edit and approve the waiver |
| `/admin/route` | US2 | Add, edit, reorder, remove cues and stops |
| `/admin/registrations` | US3 | Table of registrations for the current edition, total riders, status filter |
| `/admin/subscribers` | US4 | Active count, list, status filter |
| `/admin/posts`, `/admin/posts/new`, `/admin/posts/[id]` | US5 | List, create, edit with preview, publish or unpublish, "Email subscribers" option |

## Route handlers

| Method and path | Auth | Response |
|-----------------|------|----------|
| `GET /admin/registrations/export` | Organizer session | `text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="moonlight-ride-<year>-registrations.csv"`. Columns: Registered At, Full Name, Email, Phone, Party Size, Emergency Contact, Emergency Phone, Status, Waiver Version. Cells starting with `= + - @` are prefixed with `'` (CSV formula injection guard). 401 without a session. |
| `GET /admin/subscribers/export` | Organizer session | CSV: Email, Status, Confirmed At. Same guards. |
| `POST /api/unsubscribe/[token]` | Token | RFC 8058 one-click target for the `List-Unsubscribe-Post` header; 200 always (no enumeration) |
| `GET, POST /api/auth/[...nextauth]` | — | Auth.js |
| `GET /api/cron/retention` | `Authorization: Bearer $CRON_SECRET` | Runs retention (R11); 200 with counts as JSON; 401 otherwise |

## Security headers (all responses)

Content-Security-Policy with `frame-src https://ridewithgps.com`, `frame-ancestors 'none'`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Strict-Transport-Security` in production. Admin pages send `Cache-Control: no-store` and
`X-Robots-Tag: noindex`.

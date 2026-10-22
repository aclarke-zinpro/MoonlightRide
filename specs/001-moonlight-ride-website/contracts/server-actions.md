# Contract: Server Actions

All actions return a discriminated result; they never throw to the client:

```ts
type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]>; values?: Record<string, string> };
```

Common rules:

- Input is validated with the Zod schema listed; failures return `fieldErrors` with human-readable,
  actionable messages and echo `values` (excluding secrets) so forms keep what was typed (FR-011).
- Public form actions run the spam checks (R7): honeypot `website` must be empty, signed `formTs`
  must be at least 3 s old, IP rate limit of 10 per hour. A bot hit returns the normal success shape
  and does nothing.
- Organizer actions call `requireOrganizer()` first; with no session they return
  `{ ok: false, formError: "Please sign in again." }`, and pages redirect.
- Successful organizer edits call `revalidatePath` for the affected public pages.
- Unexpected errors are logged (pino, redacted) and return
  `formError: "Something went wrong on our side. Please try again in a minute."`

## Public actions

### `registerRider(formData)` (US3)

| Field | Rule | Example message |
|-------|------|-----------------|
| fullName | 2-100 chars, trimmed | "Enter your full name." |
| email | valid email, lower-cased | "Enter an email address like name@example.com." |
| phone | optional; 7-20 of `0-9 +()-` and space | "Enter a phone number with 7 to 20 digits, or leave it blank." |
| emergencyContactName | 2-100 | "Enter the name of someone we can call in an emergency." |
| emergencyContactPhone | 7-20 | "Enter a phone number for your emergency contact." |
| partySize | integer 1-10 | "Party size must be between 1 and 10 riders." |
| acceptWaiver | must be `"on"` | "You need to accept the waiver to register." |
| waiverVersionId | must equal the current approved version | formError: "The waiver was just updated. Please review it and accept again." |

Results:

- Success: `{ ok: true, data: { registrationId }, message }`, sends `registration_confirmation`.
- Already registered (active, same edition): `{ ok: false, formError: "This email is already registered for this year's ride. Check your inbox for your confirmation email." }`
- Closed or full or past: `{ ok: false, formError: "Registration is closed: <reason>." }`
- Capacity is checked inside a transaction so that two people cannot both take the last spot.
- An email send failure still returns success; it is recorded in `email_log` as `failed`.

### `cancelRegistration(token)` (US3)

Valid active token: status becomes `cancelled`, `registration_cancelled` email sent, returns success.
Invalid, used, or past the ride: `{ ok: false, formError: "This cancellation link is no longer valid." }`

### `subscribe(formData)` (US4)

Field `email` (valid). Always returns
`{ ok: true, message: "Thanks! Check your email to confirm your subscription." }` whether new,
pending, or already active (US4 scenario 5). New or unsubscribed: becomes `pending`, confirm email
sent. Pending: resend if more than 10 minutes since the last one. Active: no email.

### `confirmSubscription(token)` (US4)

Pending and not expired: becomes `active`. Already active: success (idempotent).
Expired or unknown: `{ ok: false, formError: "This confirmation link has expired. Sign up again to get a new one." }`

### `unsubscribe(token)` (US4)

Any valid token: becomes `unsubscribed` (idempotent), returns success. Unknown: same success message
(no enumeration).

## Organizer actions

### `signIn(formData)` (auth)

email and password. Wrong credentials: `formError: "Email or password is incorrect."`. After 5
failures in 15 min for the email or IP: `formError: "Too many sign-in attempts. Try again in 15 minutes."`

### `updateRideEdition(formData)` (US1)

All `ride_edition` fields with the rules in data-model.md; percentages must sum to 100
("Gravel, trail, and paved must add up to 100%."). Revalidates `/`, `/route`, `/register`.

### `setRegistrationOpen({ open, capacity })` (US3)

Opening is refused when the current waiver is not approved: "Approve the waiver before opening
registration." Capacity below the current active rider count is refused.

### `saveWaiver({ body })` and `approveWaiver({ versionId })` (US3)

Saving creates a new version (unapproved). Approving sets `approved_at` and `approved_by`.

### `saveCue`, `deleteCue`, `reorderCues({ ids })` (US2)

### `savePoi`, `deletePoi`, `reorderPois({ ids })` (US2)

Reorder takes the full ordered id list for the edition; a mismatched list is refused.

### `savePost(formData)` (US5)

Fields: title, slug (optional, generated from the title), summary, body, coverImage (file, max 5 MB,
jpeg/png/webp), coverImageAlt (required with an image). Slug collision:
"Another post already uses this web address. Choose a different one." Saves as draft.

### `publishPost({ id, notifySubscribers })` (US5, US4)

Sets `published`, sets `published_at` if empty, revalidates `/`, `/updates`, `/updates/[slug]`.
If `notifySubscribers` and `notified_at` is null: emails all active subscribers in batches, sets
`notified_at`, returns `{ sent, failed }`. If already notified: publishes without emailing and says
"Subscribers were already emailed about this post."

### `unpublishPost({ id })`, `deletePost({ id })` (US5)

Unpublish sets `draft`. Delete is allowed only for drafts that have never been published.

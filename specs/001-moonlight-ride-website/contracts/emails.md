# Contract: Emails

All emails are sent from `MAIL_FROM` (for example `Moonlight Ride <ride@<organizer-domain>>`),
have both HTML and plain-text parts, use the site's dark and orange styling with live text (no
text-in-image), and are logged in `email_log`. Links use absolute `SITE_URL` URLs.

| Kind | Trigger | Subject | Must contain |
|------|---------|---------|--------------|
| `registration_confirmation` | `registerRider` success | "You're registered for Moonlight Ride <year>" | Rider name, party size, date and start time with time zone, start location with map link, parking notes, ride prep reminders (lights, warm clothes, wide tires), link to `/route`, cancel link `/register/cancel/<token>` |
| `registration_cancelled` | `cancelRegistration` success | "Your Moonlight Ride registration is cancelled" | Confirmation and a link to register again while registration is open |
| `subscription_confirm` | `subscribe` (new, re-subscribe, or resend) | "Confirm your Moonlight Ride updates" | Confirm link `/subscribe/confirm/<token>` (expires in 7 days), note to ignore if not requested |
| `post_notification` | `publishPost` with notify | Post title | Post title, summary, cover image with alt text (if any), "Read the update" link to `/updates/<slug>`, unsubscribe link `/unsubscribe/<token>`; headers `List-Unsubscribe: <SITE_URL/api/unsubscribe/<token>>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` |

In tests, `MemoryMailer` exposes `sent: { to, subject, html, text, headers }[]` and
`lastLinkTo(email, pathPrefix)` so end-to-end tests can follow emailed links.

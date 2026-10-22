# Data Model: Moonlight Ride Website

PostgreSQL tables (Drizzle schema). All tables have `id` (UUID, primary key), `created_at`, and
`updated_at` (timestamptz) unless noted. Validation rules are enforced by Zod at the boundary and
by database constraints where listed.

## ride_edition

One row per year's ride. Exactly one edition is `is_current = true`.

| Field | Type | Rules |
|-------|------|-------|
| year | int | unique; 2000-2100 |
| title | text | 1-80 chars, e.g. "Moonlight Ride 2026" |
| starts_at | timestamptz | required |
| time_zone | text | IANA zone; default `America/Chicago` |
| start_location_name | text | 1-200 chars |
| start_location_address | text | 1-300 chars |
| start_lat, start_lng | numeric | valid coordinates; used for the "open in maps" link |
| parking_notes | text (Markdown) | max 2,000 chars |
| intro, why_this_date, ride_prep, route_description | text (Markdown) | max 5,000 chars each |
| organizer_intro | text (Markdown) | max 2,000 chars |
| distance_miles | numeric(5,1) | > 0 |
| pct_gravel, pct_trail, pct_paved | int | 0-100; sum = 100 |
| elevation_gain_ft | int | ≥ 0 |
| rwgps_route_id | text | digits only; e.g. `57148740` |
| rwgps_event_url | text | https URL on ridewithgps.com |
| static_map_image_url | text | fallback image (FR-008) |
| registration_open | boolean | default false |
| capacity | int, nullable | null = unlimited; ≥ 1 |
| is_current | boolean | partial unique index where true |

**Derived state** (computed, not stored): `phase` = `upcoming` (now < starts_at) |
`past` (now ≥ starts_at + 6 hours). `registration_status` = `open` only when
`registration_open && phase = upcoming && active riders < capacity && current waiver approved`;
otherwise `closed` with a reason (`organizer_closed`, `full`, `past`, `waiver_not_approved`).

**Seed**: the 2026 edition from the info sheet (Saturday, October 24, 2026, 6:00 PM CT; Carleton
Arboretum North Trailhead, Canada Ave and 320th St W, Northfield; 15.8 mi; 77/6/17; 305 ft).

## cue

| Field | Type | Rules |
|-------|------|-------|
| ride_edition_id | FK → ride_edition | cascade delete |
| position | int | unique per edition; defines order |
| text | text | 1-500 chars |
| mile | numeric(4,1), nullable | 0 - distance_miles |
| is_important | boolean | highlighted (e.g. off-road section) |
| is_optional_detour | boolean | labeled "Optional" |

## point_of_interest

| Field | Type | Rules |
|-------|------|-------|
| ride_edition_id | FK → ride_edition | cascade delete |
| position | int | unique per edition |
| name | text | 1-120 chars |
| mile | numeric(4,1) | 0 - distance_miles |
| kind | enum | `rest_stop` \| `food_drink` \| `scenic` \| `landmark` |
| description | text (Markdown) | max 1,000 chars |
| is_optional | boolean | |
| photo_url, photo_alt | text, nullable | alt required when photo set |

**Seed**: Waterford Historic Bridge (landmark, 0), Sciota Town Hall (landmark, about 2.5),
Cannon River access (scenic, optional, 5.8), Convenience Store at Hwy 56 and 292nd St E
(rest stop, 8.2), R Bar in Randolph (food and drink, optional, 8.7), river beach on Dakota County
park land (scenic, 10, "fire if conditions allow").

## waiver_version

| Field | Type | Rules |
|-------|------|-------|
| ride_edition_id | FK → ride_edition | |
| version | int | unique per edition, increments on every edit |
| body | text (Markdown) | 50-20,000 chars |
| approved_at | timestamptz, nullable | set when the organizer approves; registration needs an approved current version |
| approved_by | FK → organizer, nullable | |

The current waiver is the highest `version` for the edition. Editing creates a new row, which starts
unapproved. Seeded with placeholder text, unapproved.

## registration

| Field | Type | Rules |
|-------|------|-------|
| ride_edition_id | FK → ride_edition | |
| full_name | text | 2-100 chars |
| email | citext | valid email, max 254; **unique (ride_edition_id, email) where status = active** |
| phone | text, nullable | 7-20 chars, digits and `+()- ` |
| emergency_contact_name | text | 2-100 chars |
| emergency_contact_phone | text | 7-20 chars |
| party_size | int | 1-10 |
| waiver_version_id | FK → waiver_version | must be the approved current version at submit time |
| waiver_accepted_at | timestamptz | server time |
| status | enum | `active` \| `cancelled` |
| cancel_token_hash | text | SHA-256 of token |
| cancelled_at | timestamptz, nullable | |
| anonymized_at | timestamptz, nullable | set by the retention job; personal fields are nulled |

**State transitions**: `active → cancelled` (rider uses the cancel link, before the ride).
`active|cancelled → anonymized` (retention job, 12 months after the ride). A cancelled email can
register again (new row).

**Active rider count** = sum of `party_size` where status = active.

## subscriber

| Field | Type | Rules |
|-------|------|-------|
| email | citext | unique; valid email |
| status | enum | `pending` \| `active` \| `unsubscribed` |
| confirm_token_hash | text, nullable | expires 7 days after `confirm_sent_at` |
| confirm_sent_at | timestamptz | |
| confirmed_at | timestamptz, nullable | |
| unsubscribe_token_hash | text | |
| unsubscribed_at | timestamptz, nullable | |

**State transitions**: (new) → `pending` → `active` (confirm link) → `unsubscribed` (unsubscribe).
`unsubscribed` → `pending` if the person subscribes again. A re-submit of a `pending` email resends
confirmation (at most once per 10 minutes). Pending rows older than 30 days are deleted.

## post

| Field | Type | Rules |
|-------|------|-------|
| title | text | 3-150 chars |
| slug | text | unique; lowercase, hyphenated, from title; editable |
| summary | text | max 300 chars; used in lists and emails |
| body | text (Markdown) | 1-50,000 chars; sanitized when rendered |
| cover_image_url, cover_image_alt | text, nullable | alt required when image set (1-200 chars) |
| status | enum | `draft` \| `published` |
| published_at | timestamptz, nullable | set on first publish |
| notified_at | timestamptz, nullable | set when emailed to subscribers; never sent twice |
| author_id | FK → organizer | |

**State transitions**: `draft → published` (publish), `published → draft` (unpublish).
`notified_at` is set once and is never cleared.

## organizer

| Field | Type | Rules |
|-------|------|-------|
| name | text | 1-100 chars |
| email | citext | unique |
| password_hash | text | bcrypt |
| last_login_at | timestamptz, nullable | |

## login_attempt

| Field | Type | Rules |
|-------|------|-------|
| email | citext | |
| ip_hash | text | SHA-256 of IP + secret |
| succeeded | boolean | |
| attempted_at | timestamptz | indexed; rows older than 24 h are purged |

## rate_limit_event

| Field | Type | Rules |
|-------|------|-------|
| bucket | text | e.g. `register`, `subscribe` |
| ip_hash | text | |
| occurred_at | timestamptz | indexed; rows older than 24 h are purged |

## email_log

| Field | Type | Rules |
|-------|------|-------|
| kind | enum | `registration_confirmation` \| `registration_cancelled` \| `subscription_confirm` \| `post_notification` |
| to_email | citext | nulled by the retention job |
| related_id | uuid | registration, subscriber, or post id |
| status | enum | `sent` \| `failed` |
| provider_message_id | text, nullable | |
| error | text, nullable | |

## Relationships

```text
ride_edition 1─* cue
ride_edition 1─* point_of_interest
ride_edition 1─* waiver_version 1─* registration
ride_edition 1─* registration
organizer    1─* post
subscriber, login_attempt, rate_limit_event, email_log: standalone
```

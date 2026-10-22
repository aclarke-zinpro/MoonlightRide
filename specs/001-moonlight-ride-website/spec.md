# Feature Specification: Moonlight Ride Website

**Feature Branch**: `001-moonlight-ride-website`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "I'm going to create a website for an annual "moonlight ride" bike ride event that I organize every fall. I'd like the website to have information about the ride itself (date, time, location, etc.), also I'd like to have a map of the ride with more details on directions, and information on interesting places to stop along the way. I'd also like a way for people to sign up for information about the ride, and I'd like people to be able to register for the ride. I'd like some sort of blog functionality on the site where I can post updates and information about the ride as well. Attached is an info sheet I created about the ride that I'd like to use as a style guide for the website. I also have a link to the ride map in RidewithGPS that I can share as well."

**Reference material**: "Moonlight Ride 2026 Info Sheet" (PDF, 3 pages) supplied by the organizer. It is the
source for the initial content and the visual identity described below.

## Clarifications

### Session 2026-10-22

- Q: Is registration free, or is there a fee or donation? → A: Free, no payment of any kind.
- Q: Is a liability waiver required, and who writes it? → A: Yes; placeholder wording is provided
  for the organizer to review and approve.
- Q: Should the site email subscribers about new posts? → A: Yes, when the organizer chooses to
  for a given post.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learn about this year's ride (Priority: P1)

A prospective rider (new or returning) visits the website and, from the home page, immediately sees
when and where this year's Moonlight Ride happens and what to bring. They can read why the date was
chosen (closest weekend day to the full moon), the ride's casual nature, the preparation guidance
(warm clothes, fully charged headlight and taillight, wide-tire bike for gravel and a short off-road
section), the route summary (distance, surface mix, elevation), the start location, and parking
guidance. They also learn who organizes the ride and its 30+ year history.

**Why this priority**: This is the core reason the site exists. Even with nothing else built, a
single page with accurate ride details replaces the PDF info sheet and lets riders show up prepared.

**Independent Test**: Load the home page and confirm the date (Saturday, October 24, 2026), start
time (6:00 PM), start location, parking guidance, preparation checklist, and route summary are all
visible without navigating elsewhere.

**Acceptance Scenarios**:

1. **Given** a visitor on the home page, **When** the page loads, **Then** the ride name, date,
   start time, and start location are visible in the first screen on both phone and desktop.
2. **Given** a visitor on the home page, **When** they read the ride details, **Then** they see the
   route summary (15.8 miles; 77% gravel, 6% doubletrack trail, 17% paved; about 305 ft elevation
   gain), the preparation guidance, and parking guidance.
3. **Given** a visitor before ride day, **When** they view the home page, **Then** they see how many
   days remain until the ride.
4. **Given** a visitor after this year's ride date has passed, **When** they view the home page,
   **Then** the site indicates the ride has happened and points them to sign up for updates about
   next year's ride.
5. **Given** the organizer, **When** they update the ride date, time, location, or details for a
   new year, **Then** the public pages show the new values without any other page changes.

---

### User Story 2 - Explore the route, directions, and stops (Priority: P2)

A registered or prospective rider opens the Route page to see a map of the loop, the turn-by-turn
cue sheet, and the interesting places along the way (rest stops and landmarks), each with its
mile marker and a short description. They can open the full route in the external route-mapping
service to download it to a GPS device or phone.

**Why this priority**: Riding at night on gravel, riders need to know the route and where they can
stop. This is the second most requested piece of information after date and place.

**Independent Test**: Open the Route page and confirm the map is visible, all cue-sheet steps appear
in order, every listed stop shows its mile marker and description, and the link to the full route
opens the external route page.

**Acceptance Scenarios**:

1. **Given** a visitor on the Route page, **When** the page loads, **Then** an interactive map of the
   route is displayed, and a link to open the full route in the external route-mapping service is
   available.
2. **Given** a visitor on the Route page, **When** they read the directions, **Then** they see every
   cue in ride order, with the "Important: off-road section" cue visually highlighted and the
   optional detour clearly marked as optional.
3. **Given** a visitor on the Route page, **When** they view the stops list, **Then** they see at
   least: Cannon River access (optional detour, mile 5.8), Convenience Store (mile 8.2), R Bar in
   Randolph (mile 8.7), and the river beach on Dakota County park land (mile 10, fire if conditions
   allow), each with a description and whether it is optional.
4. **Given** the embedded map cannot load (e.g., the external service is unavailable), **When** a
   visitor opens the Route page, **Then** a static route image and the cue sheet are still shown,
   along with a message and the external link.
5. **Given** the organizer, **When** they add, edit, reorder, or remove a stop or cue, **Then** the
   Route page reflects the change.

---

### User Story 3 - Register for the ride (Priority: P2)

A rider who plans to attend fills out a short registration form (name, email, optional phone,
emergency contact, number of riders in their party, and acceptance of the ride waiver) and receives
an on-screen confirmation and a confirmation email with the ride details. The organizer can view
the list of registrants and export it.

**Why this priority**: Registration tells the organizer how many people to expect and gives them a
way to reach riders on ride day. It is valuable on its own but depends on riders first knowing about
the ride (Story 1).

**Independent Test**: Submit a valid registration and confirm the on-screen confirmation, the
confirmation email, and that the registration appears in the organizer's registrant list and export.

**Acceptance Scenarios**:

1. **Given** a visitor on the Register page, **When** they submit all required fields validly and
   accept the waiver, **Then** they see a confirmation and receive a confirmation email containing the
   date, time, start location, and preparation reminders.
2. **Given** a visitor submits the form with a missing or invalid required field, **When** they
   submit, **Then** the form is not accepted and each problem field shows a message explaining how to
   fix it, with previously entered values preserved.
3. **Given** an email address already registered for this year's ride, **When** someone registers
   again with it, **Then** no duplicate is created and the visitor is told they are already
   registered.
4. **Given** the organizer is signed in, **When** they open the registrant list, **Then** they see all
   registrations for this year's ride with a total rider count, and can export it as a spreadsheet file.
5. **Given** registration is closed (by the organizer, or because the ride date has passed), **When**
   a visitor opens the Register page, **Then** the form is replaced by a message explaining that
   registration is closed.
6. **Given** a registered rider, **When** they follow the cancellation link in their confirmation
   email, **Then** their registration is cancelled and removed from the active rider count.
7. **Given** a visitor who is registering, **When** they review the waiver, **Then** the waiver text
   is shown in full and must be explicitly accepted before submission (see FR-018).

---

### User Story 4 - Sign up for ride updates (Priority: P3)

A visitor who is interested but not ready to register (or who wants to hear about next year's ride)
enters their email to join the Moonlight Ride mailing list. They confirm their subscription via
email, receive an email when the organizer publishes a new blog post, and can unsubscribe at any
time with one click.

**Why this priority**: This keeps interested riders engaged across years, but the ride can run
without it.

**Independent Test**: Subscribe with an email, confirm via the emailed link, publish a blog post,
and verify the subscriber receives a notification; then unsubscribe and verify no further emails
are sent.

**Acceptance Scenarios**:

1. **Given** a visitor on any page, **When** they submit a valid email in the updates sign-up form,
   **Then** they see a message asking them to check their email and receive a confirmation email.
2. **Given** a pending subscriber, **When** they click the confirmation link, **Then** they become an
   active subscriber; unconfirmed addresses never receive update emails.
3. **Given** an active subscriber, **When** the organizer publishes a blog post and chooses to notify
   subscribers, **Then** each active subscriber receives one email with the post title, summary, and
   link.
4. **Given** any update email, **When** the recipient clicks the unsubscribe link, **Then** they are
   removed from the active list immediately and see a confirmation.
5. **Given** an email that is already subscribed, **When** it is submitted again, **Then** no
   duplicate is created and the visitor sees the same neutral "check your email" message (so the form
   does not reveal who is subscribed).
6. **Given** the organizer is signed in, **When** they view subscribers, **Then** they see the active
   subscriber count and can export the list.

---

### User Story 5 - Read and publish ride updates (blog) (Priority: P3)

The organizer signs in, writes a post (title, body with formatting, optional image), previews it,
and publishes it immediately or saves it as a draft. Visitors see the newest posts on the Updates
page (newest first) and the latest post headline on the home page, and can open each post at its
own shareable address.

**Why this priority**: Posts let the organizer share weather calls, route changes, and recaps, but
the core ride information is already covered by Stories 1-2.

**Independent Test**: Sign in as organizer, create and publish a post, confirm it appears first on
the Updates page and its own page; create a draft and confirm visitors cannot see it.

**Acceptance Scenarios**:

1. **Given** the organizer is signed in, **When** they publish a post, **Then** it appears at the top
   of the Updates page and its headline appears on the home page.
2. **Given** a post saved as a draft, **When** a visitor (not signed in) browses the site or opens the
   draft's address, **Then** the draft is not visible.
3. **Given** a published post, **When** the organizer edits or unpublishes it, **Then** the public
   view reflects the change.
4. **Given** more than 10 published posts, **When** a visitor views the Updates page, **Then** posts
   are paginated 10 per page, newest first.
5. **Given** a visitor who is not signed in, **When** they try to open any organizer page, **Then**
   they are sent to the sign-in page and cannot create, edit, or view drafts.

---

### Edge Cases

- Visitor opens the site on a phone in the dark at the trailhead: pages must be readable on small
  screens with the dark theme and must not require the map to load to see the cue sheet.
- The external route map is slow or unavailable: the Route page falls back to a static image plus
  cue sheet (US2 scenario 4).
- The ride date is postponed (e.g., weather): the organizer updates the date and can notify
  subscribers via a blog post; registrants receive the update as well.
- Registration form receives automated spam submissions: the site rejects bot submissions without
  burdening real riders (no puzzle challenges for normal users).
- Registration for a new year opens: registrations from previous years do not count toward the new
  year's rider count but remain available to the organizer.
- Email delivery fails for a confirmation: the registration is still saved, and the organizer can see
  which confirmations failed.
- Organizer enters an incorrect password repeatedly: sign-in is temporarily slowed or locked to
  prevent guessing.
- Visitor uses a screen reader or keyboard only: all forms, navigation, and the cue sheet are fully
  usable (the map has a text alternative: the cue sheet).

## Requirements *(mandatory)*

### Functional Requirements

**Ride information**

- **FR-001**: The site MUST display the current year's ride name, date, start time, start location
  (with a link that opens directions in the visitor's maps app), and parking guidance on the home page.
- **FR-002**: The site MUST display the ride description, the "why this date" explanation, preparation
  guidance, route summary (distance, surface percentages, elevation gain), and organizer introduction.
- **FR-003**: The site MUST show a countdown (days remaining) before the ride, and a "this year's ride
  has happened" state after the ride date.
- **FR-004**: The organizer MUST be able to edit all ride information (date, time, location, text
  sections, route summary) from a signed-in management area, without changing site code.

**Route, directions, and stops**

- **FR-005**: The site MUST display an interactive route map and a link to the full route on the
  external route-mapping service.
- **FR-006**: The site MUST display the turn-by-turn cue sheet in order, with highlighted "important"
  cues and clearly labeled optional detours.
- **FR-007**: The site MUST display a list of points of interest, each with name, mile marker, type
  (rest stop, food/drink, scenic, landmark), description, and whether it is optional.
- **FR-008**: The Route page MUST remain usable (static image + cue sheet + external link) when the
  interactive map cannot load.
- **FR-009**: The organizer MUST be able to add, edit, reorder, and remove cues and points of interest.

**Registration**

- **FR-010**: Visitors MUST be able to register with: full name, email, optional phone, emergency
  contact name and phone, and number of riders in their party (1-10).
- **FR-011**: The system MUST validate all registration fields and show field-level, actionable error
  messages without discarding entered data.
- **FR-012**: The system MUST prevent duplicate registrations for the same email in the same ride year.
- **FR-013**: The system MUST send a confirmation email containing ride details and a cancellation link.
- **FR-014**: Riders MUST be able to cancel their registration via the link in their confirmation email.
- **FR-015**: The organizer MUST be able to open/close registration and set an optional maximum rider
  capacity; when capacity is reached, registration closes automatically.
- **FR-016**: The organizer MUST be able to view registrants for the current year with a total rider
  count and export them to a spreadsheet file (CSV).
- **FR-017**: Registration MUST be free of charge; the site does not collect payment or donations.
- **FR-018**: Registration MUST require acceptance of a liability waiver, and the acceptance (with the
  date and time and waiver version) MUST be recorded. Placeholder waiver wording is supplied with
  the site and MUST be reviewed and approved by the organizer before registration opens; the
  organizer MUST be able to edit the waiver text, and each edit creates a new waiver version.

**Updates sign-up**

- **FR-019**: Visitors MUST be able to subscribe to updates with an email address from a form available
  on every page.
- **FR-020**: Subscriptions MUST be confirmed via an emailed link (double opt-in) before any update
  email is sent.
- **FR-021**: Every update email MUST include a one-click unsubscribe link that takes effect immediately.
- **FR-022**: When publishing a post, the organizer MUST be able to choose to email it to active
  subscribers; the choice is made per post and defaults to not sending. Each post is emailed at most
  once, even if it is later edited or re-published.
- **FR-023**: The organizer MUST be able to view the active subscriber count and export subscribers.

**Blog**

- **FR-024**: The organizer MUST be able to create, edit, preview, save as draft, publish, and
  unpublish posts with a title, formatted body, optional cover image (with required alt text), and
  publish date.
- **FR-025**: Visitors MUST be able to read published posts on an Updates page (newest first,
  10 per page) and on individual shareable pages; drafts MUST never be visible to visitors.
- **FR-026**: The home page MUST show the headline and link of the most recently published post.

**Access and administration**

- **FR-027**: All organizer functions MUST require sign-in; only authorized organizer accounts
  (initially one) can access them.
- **FR-028**: Repeated failed sign-in attempts MUST be throttled.
- **FR-029**: Public forms MUST include protection against automated spam submissions that does not
  require normal users to solve a puzzle.

**Look and feel**

- **FR-030**: The site MUST follow the visual identity of the 2026 info sheet: a dark, night-sky
  banner with moonlit forest imagery and a full moon; "Moonlight Ride" titles in a bold serif typeface
  in burnt orange with thin orange rule lines and a small star ornament; clean sans-serif body text.
- **FR-031**: The site MUST be fully usable on phones, tablets, and desktops, and meet WCAG 2.2 AA
  (including contrast of orange text on dark backgrounds).

### Key Entities

- **Ride Edition**: One year's ride. Date, start time, start location and coordinates, parking notes,
  description sections, route summary (distance, surface mix, elevation), external route link,
  registration status (open/closed), optional capacity.
- **Cue**: One turn-by-turn direction step belonging to a Ride Edition. Order, text, optional mile
  marker, flags for "important" and "optional detour".
- **Point of Interest**: A stop or landmark on the route. Name, mile marker, type, description,
  optional flag, optional photo.
- **Registration**: A rider's sign-up for a Ride Edition. Name, email, phone, emergency contact,
  party size, waiver acceptance (version and timestamp), status (active/cancelled), created date.
- **Subscriber**: An email on the updates list. Email, status (pending/active/unsubscribed),
  confirmation and unsubscribe dates.
- **Post**: A blog update. Title, body, cover image and alt text, status (draft/published),
  publish date, author.
- **Organizer**: A person allowed to manage the site. Name, email, sign-in credentials.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can find the ride date, start time, and start location within
  10 seconds of landing on the site, on a phone.
- **SC-002**: A rider can complete registration in under 2 minutes, and at least 95% of registration
  attempts with valid information succeed on the first submission.
- **SC-003**: Confirmation emails (registration and subscription) arrive within 5 minutes for at least
  95% of submissions.
- **SC-004**: The organizer can publish a new update post in under 5 minutes, and can update the ride
  date and details for a new year in under 15 minutes, without developer help.
- **SC-005**: Pages show their main content within 3 seconds on a typical mobile connection, and the
  cue sheet is readable even when the map fails to load.
- **SC-006**: The site handles 500 visitors in the hour after an announcement without errors or
  noticeable slowdown.
- **SC-007**: 100% of public pages pass an automated accessibility check at WCAG 2.2 AA with no
  critical issues.
- **SC-008**: Zero automated spam registrations or subscriptions appear in the organizer's lists
  during the first registration season.

## Assumptions

- The site serves one ride per year; the organizer updates the same site each year. A public archive
  of past years' rides is out of scope for this version (registrations and posts from past years are
  retained for the organizer).
- One organizer account (Adam Clarke) at launch; adding co-organizers is supported by the same sign-in
  but no role differences are needed.
- Registration is free and requires no payment or donation (confirmed by the organizer).
- The placeholder waiver text is not legal advice; the organizer is responsible for having it
  reviewed before registration opens.
- The route map comes from the organizer's existing RideWithGPS event
  (https://ridewithgps.com/events/502033-moonlight-ridge-2026); the site embeds or links to it and
  does not draw its own route. The organizer has confirmed this link is correct.
- Initial content (description, cues, stops, parking, start point) is taken from the 2026 info sheet.
- The site sends its own transactional email (confirmations, cancellations) through an email-sending
  service; the organizer will provide or approve a sending address on their own domain.
- Rider personal data (contact and emergency contacts) is used only for running the ride, is visible
  only to organizers, and is deleted or anonymized 12 months after the ride date.
- Blog comments, rider accounts/profiles, ride-day check-in, and live rider tracking are out of scope.
- The organizer will supply high-resolution versions of the banner artwork from the info sheet.

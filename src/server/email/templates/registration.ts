import { mapsSearchUrl } from "@/lib/maps";
import { formatRideDate, formatRideTime } from "@/lib/dates";
import type { Registration, RideEdition } from "@/server/db/schema";
import type { MailMessage } from "../mailer";
import { button, emailLayout, escapeHtml, markdownToEmailHtml, markdownToText } from "./layout";

type Edition = Pick<
  RideEdition,
  | "title"
  | "startsAt"
  | "timeZone"
  | "startLocationName"
  | "startLocationAddress"
  | "parkingNotes"
  | "ridePrep"
>;

export function registrationConfirmationEmail(input: {
  registration: Pick<Registration, "fullName" | "email" | "partySize">;
  edition: Edition;
  siteUrl: string;
  cancelToken: string;
}): MailMessage {
  const { registration, edition, siteUrl, cancelToken } = input;
  const when = `${formatRideDate(edition.startsAt, edition.timeZone)} at ${formatRideTime(edition.startsAt, edition.timeZone)}`;
  const maps = mapsSearchUrl(edition.startLocationName, edition.startLocationAddress);
  const routeUrl = `${siteUrl}/route`;
  const cancelUrl = `${siteUrl}/register/cancel/${cancelToken}`;
  const riders = registration.partySize === 1 ? "1 rider" : `${registration.partySize} riders`;
  const subject = `You're registered for ${edition.title}`;

  const text = [
    `Hi ${registration.fullName},`,
    "",
    `You're registered for ${edition.title} (${riders}).`,
    "",
    `When: ${when}`,
    `Where: ${edition.startLocationName}, ${edition.startLocationAddress}`,
    `Map: ${maps}`,
    "",
    "Parking:",
    markdownToText(edition.parkingNotes),
    "",
    "Before you come:",
    markdownToText(edition.ridePrep),
    "",
    `Route, directions, and stops: ${routeUrl}`,
    "",
    `Can't make it? Cancel your registration: ${cancelUrl}`,
  ].join("\n");

  const html = emailLayout(
    "You're registered!",
    `<p>Hi ${escapeHtml(registration.fullName ?? "")},</p>
<p>You're registered for <strong>${escapeHtml(edition.title)}</strong> (${riders}).</p>
<p><strong>When:</strong> ${escapeHtml(when)}<br>
<strong>Where:</strong> ${escapeHtml(edition.startLocationName)}, ${escapeHtml(edition.startLocationAddress)}<br>
<a href="${escapeHtml(maps)}" style="color:#e8893d">Open in Maps</a></p>
<h2 style="color:#d9772b;font-size:18px;margin:20px 0 4px">Parking</h2>
${markdownToEmailHtml(edition.parkingNotes)}
<h2 style="color:#d9772b;font-size:18px;margin:20px 0 4px">Before you come</h2>
${markdownToEmailHtml(edition.ridePrep)}
${button(routeUrl, "See the route and stops")}`,
    `Can't make it? <a href="${escapeHtml(cancelUrl)}" style="color:#a9a39a">Cancel your registration</a>.`,
  );

  return { to: registration.email ?? "", subject, text, html };
}

export function registrationCancelledEmail(input: {
  registration: Pick<Registration, "fullName" | "email">;
  edition: Pick<RideEdition, "title">;
  siteUrl: string;
}): MailMessage {
  const { registration, edition, siteUrl } = input;
  const registerUrl = `${siteUrl}/register`;
  return {
    to: registration.email ?? "",
    subject: "Your Moonlight Ride registration is cancelled",
    text: [
      `Hi ${registration.fullName},`,
      "",
      `Your registration for ${edition.title} is cancelled. We'll miss you!`,
      "",
      `Changed your mind? You can register again while registration is open: ${registerUrl}`,
    ].join("\n"),
    html: emailLayout(
      "Your registration is cancelled",
      `<p>Hi ${escapeHtml(registration.fullName ?? "")},</p>
<p>Your registration for <strong>${escapeHtml(edition.title)}</strong> is cancelled. We'll miss you!</p>
<p>Changed your mind? You can register again while registration is open.</p>
${button(registerUrl, "Register again")}`,
    ),
  };
}

import type { Post } from "@/server/db/schema";
import type { MailMessage } from "../mailer";
import { button, emailLayout, escapeHtml } from "./layout";

export function subscriptionConfirmEmail(input: { to: string; token: string; siteUrl: string }): MailMessage {
  const url = `${input.siteUrl}/subscribe/confirm/${input.token}`;
  return {
    to: input.to,
    subject: "Confirm your Moonlight Ride updates",
    text: [
      "Thanks for signing up for Moonlight Ride updates!",
      "",
      `Confirm your email to start getting updates (this link works for 7 days): ${url}`,
      "",
      "If you didn't sign up, you can ignore this email.",
    ].join("\n"),
    html: emailLayout(
      "Confirm your email",
      `<p>Thanks for signing up for Moonlight Ride updates! Confirm your email to start getting them.</p>
${button(url, "Confirm my email")}
<p>This link works for 7 days.</p>`,
      "If you didn't sign up, you can ignore this email.",
    ),
  };
}

export function postNotificationEmail(input: {
  to: string;
  post: Pick<Post, "title" | "summary" | "slug" | "coverImageUrl" | "coverImageAlt">;
  siteUrl: string;
  unsubscribeToken: string;
}): MailMessage {
  const { post, siteUrl, unsubscribeToken } = input;
  const postUrl = `${siteUrl}/updates/${post.slug}`;
  const unsubscribeUrl = `${siteUrl}/unsubscribe/${unsubscribeToken}`;
  const image =
    post.coverImageUrl && post.coverImageAlt
      ? `<p><img src="${escapeHtml(post.coverImageUrl.startsWith("http") ? post.coverImageUrl : siteUrl + post.coverImageUrl)}" alt="${escapeHtml(post.coverImageAlt)}" style="max-width:100%;border-radius:8px"></p>`
      : "";
  return {
    to: input.to,
    subject: post.title,
    headers: {
      "List-Unsubscribe": `<${siteUrl}/api/unsubscribe/${unsubscribeToken}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    text: [
      post.title,
      "",
      post.summary,
      "",
      `Read the update: ${postUrl}`,
      "",
      `Unsubscribe from Moonlight Ride updates: ${unsubscribeUrl}`,
    ].join("\n"),
    html: emailLayout(
      post.title,
      `${image}<p>${escapeHtml(post.summary)}</p>${button(postUrl, "Read the update")}`,
      `You're getting this because you signed up for Moonlight Ride updates. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#a9a39a">Unsubscribe</a>.`,
    ),
  };
}

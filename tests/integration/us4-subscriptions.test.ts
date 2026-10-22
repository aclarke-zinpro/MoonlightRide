import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/db";

vi.mock("next/headers", async () => (await import("../helpers/next-mocks")).nextHeadersMock);
vi.mock("next/cache", async () => (await import("../helpers/next-mocks")).nextCacheMock);

const actions = await import("@/features/subscriptions/actions");
const subscription = await import("@/server/services/subscription");
const { signFormTimestamp } = await import("@/server/security/spam");
const { MemoryMailer, setMailer } = await import("@/server/email/mailer");
const { POST: oneClick } = await import("@/app/api/unsubscribe/[token]/route");

const mailer = new MemoryMailer();
setMailer(mailer);

const NEUTRAL = "Thanks! Check your email to confirm your subscription.";

function subscribeForm(email: string, opts: { bot?: boolean } = {}) {
  const f = new FormData();
  f.set("email", email);
  f.set("website", opts.bot ? "spam" : "");
  f.set("formTs", signFormTimestamp(Date.now() - 10_000));
  return f;
}

const confirmTokenFrom = (text: string) => text.match(/\/subscribe\/confirm\/([A-Za-z0-9_-]{43})/)?.[1];

describe("US4 subscriptions", () => {
  beforeEach(async () => {
    mailer.clear();
    await createTestDb();
  });

  it("always answers with the same neutral message and sends a confirmation to new emails", async () => {
    expect(await actions.subscribe({ ok: false }, subscribeForm("Fan@Example.com"))).toEqual({
      ok: true,
      message: NEUTRAL,
    });
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]).toMatchObject({ to: "fan@example.com", subject: "Confirm your Moonlight Ride updates" });
    expect(await subscription.listSubscribers()).toMatchObject([{ email: "fan@example.com", status: "pending" }]);
  });

  it("does not resend to a pending email within 10 minutes, and never emails active ones", async () => {
    await actions.subscribe({ ok: false }, subscribeForm("fan@example.com"));
    expect(await actions.subscribe({ ok: false }, subscribeForm("fan@example.com"))).toEqual({ ok: true, message: NEUTRAL });
    expect(mailer.sent).toHaveLength(1);

    const token = confirmTokenFrom(mailer.sent[0]!.text)!;
    expect(await subscription.confirm(token)).toBe("confirmed");
    expect(await actions.subscribe({ ok: false }, subscribeForm("fan@example.com"))).toEqual({ ok: true, message: NEUTRAL });
    expect(mailer.sent).toHaveLength(1);
    expect(await subscription.listSubscribers()).toHaveLength(1);
  });

  it("confirms idempotently and rejects expired links", async () => {
    await actions.subscribe({ ok: false }, subscribeForm("fan@example.com"));
    const token = confirmTokenFrom(mailer.sent[0]!.text)!;
    expect(await subscription.confirm(token)).toBe("confirmed");
    expect(await subscription.confirm(token)).toBe("already_confirmed");
    expect(await subscription.activeCount()).toBe(1);

    await actions.subscribe({ ok: false }, subscribeForm("late@example.com"));
    const lateToken = confirmTokenFrom(mailer.sent[1]!.text)!;
    const eightDays = new Date(Date.now() + 8 * 86_400_000);
    expect(await subscription.confirm(lateToken, eightDays)).toBe("expired");
    expect(await subscription.confirm("not-a-real-token")).toBe("invalid");
    expect(subscription.CONFIRM_EXPIRED_MESSAGE).toBe(
      "This confirmation link has expired. Sign up again to get a new one.",
    );
  });

  it("unsubscribes idempotently; unknown tokens get the same success", async () => {
    await actions.subscribe({ ok: false }, subscribeForm("fan@example.com"));
    await subscription.confirm(confirmTokenFrom(mailer.sent[0]!.text)!);
    const [sub] = await subscription.listSubscribers();
    const token = subscription.unsubscribeTokenFor(sub!.id);

    const form = new FormData();
    form.set("token", token);
    expect((await actions.unsubscribe({ ok: false }, form)).ok).toBe(true);
    expect((await actions.unsubscribe({ ok: false }, form)).ok).toBe(true);
    expect(await subscription.activeCount()).toBe(0);

    const unknown = new FormData();
    unknown.set("token", "x".repeat(43));
    expect((await actions.unsubscribe({ ok: false }, unknown)).ok).toBe(true);
  });

  it("ignores spam submissions but answers the same way", async () => {
    expect(await actions.subscribe({ ok: false }, subscribeForm("bot@example.com", { bot: true }))).toEqual({
      ok: true,
      message: NEUTRAL,
    });
    expect(await subscription.listSubscribers()).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it("returns a field error for an invalid email", async () => {
    const result = await actions.subscribe({ ok: false }, subscribeForm("nope"));
    expect(result).toMatchObject({ ok: false, fieldErrors: { email: ["Enter an email address like name@example.com."] } });
  });

  it("supports RFC 8058 one-click unsubscribe and always answers 200", async () => {
    await actions.subscribe({ ok: false }, subscribeForm("fan@example.com"));
    await subscription.confirm(confirmTokenFrom(mailer.sent[0]!.text)!);
    const [sub] = await subscription.listSubscribers();
    const token = subscription.unsubscribeTokenFor(sub!.id);
    const response = await oneClick(new Request("http://localhost/api/unsubscribe/x", { method: "POST" }), {
      params: Promise.resolve({ token }),
    });
    expect(response.status).toBe(200);
    expect(await subscription.activeCount()).toBe(0);
    const unknown = await oneClick(new Request("http://localhost/api/unsubscribe/x", { method: "POST" }), {
      params: Promise.resolve({ token: "unknown" }),
    });
    expect(unknown.status).toBe(200);
  });
});

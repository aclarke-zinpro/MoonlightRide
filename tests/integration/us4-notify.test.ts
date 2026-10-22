import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/db";
import { createTestOrganizer } from "../helpers/fixtures";

vi.mock("next/headers", async () => (await import("../helpers/next-mocks")).nextHeadersMock);
vi.mock("next/cache", async () => (await import("../helpers/next-mocks")).nextCacheMock);

const subscription = await import("@/server/services/subscription");
const posts = await import("@/server/services/post");
const { MemoryMailer, setMailer } = await import("@/server/email/mailer");

const mailer = new MemoryMailer();
setMailer(mailer);

async function activeSubscriber(email: string) {
  const { token } = await subscription.subscribe(email);
  await subscription.confirm(token!);
}

describe("US4 notifySubscribers", () => {
  let postId: string;

  beforeEach(async () => {
    mailer.clear();
    await createTestDb();
    const organizer = await createTestOrganizer();
    await activeSubscriber("one@example.com");
    await activeSubscriber("two@example.com");
    await subscription.subscribe("pending@example.com"); // never confirmed
    await activeSubscriber("gone@example.com");
    const [gone] = (await subscription.listSubscribers()).filter((s) => s.email === "gone@example.com");
    await subscription.unsubscribe(subscription.unsubscribeTokenFor(gone!.id));
    const post = await posts.savePost(organizer.id, {
      title: "Weather update",
      summary: "Clear skies forecast for Saturday.",
      body: "It's going to be **clear**.",
      slug: null,
      coverImageUrl: null,
      coverImageAlt: null,
    });
    await posts.publishPost(post.id);
    postId = post.id;
    mailer.clear();
  });

  it("emails each active subscriber exactly once with title, summary, link, and unsubscribe headers", async () => {
    const result = await subscription.notifySubscribers(postId);
    expect(result).toEqual({ sent: 2, failed: 0, alreadyNotified: false });
    expect(mailer.sent.map((m) => m.to).sort()).toEqual(["one@example.com", "two@example.com"]);
    const email = mailer.sent[0]!;
    expect(email.subject).toBe("Weather update");
    expect(email.text).toContain("Clear skies forecast for Saturday.");
    expect(email.text).toContain("/updates/weather-update");
    expect(email.text).toMatch(/\/unsubscribe\/[A-Za-z0-9_-]{43}/);
    expect(email.headers?.["List-Unsubscribe"]).toMatch(/^<http.*\/api\/unsubscribe\/[A-Za-z0-9_-]{43}>$/);
    expect(email.headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("sets notified_at and never sends the same post twice", async () => {
    await subscription.notifySubscribers(postId);
    expect((await posts.getPostById(postId))?.notifiedAt).toBeInstanceOf(Date);
    mailer.clear();
    expect(await subscription.notifySubscribers(postId)).toEqual({ sent: 0, failed: 0, alreadyNotified: true });
    expect(mailer.sent).toHaveLength(0);
  });

  it("counts failures without stopping", async () => {
    mailer.failNext = true;
    expect(await subscription.notifySubscribers(postId)).toEqual({ sent: 1, failed: 1, alreadyNotified: false });
  });
});

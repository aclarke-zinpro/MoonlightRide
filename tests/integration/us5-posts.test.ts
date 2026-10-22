import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../helpers/db";
import { createTestOrganizer } from "../helpers/fixtures";
import { cookieJar, resetCookies, revalidatePath } from "../helpers/next-mocks";

vi.mock("next/headers", async () => (await import("../helpers/next-mocks")).nextHeadersMock);
vi.mock("next/cache", async () => (await import("../helpers/next-mocks")).nextCacheMock);

const actions = await import("@/features/posts/actions");
const posts = await import("@/server/services/post");
const subscription = await import("@/server/services/subscription");
const { createSessionToken, SESSION_COOKIE } = await import("@/server/auth/session");
const { MemoryMailer, setMailer } = await import("@/server/email/mailer");

const mailer = new MemoryMailer();
setMailer(mailer);

const form = (values: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
};

const draft = { title: "Weather update", summary: "Clear skies.", body: "It will be **clear**." };

describe("US5 post actions", () => {
  beforeEach(async () => {
    resetCookies();
    mailer.clear();
    revalidatePath.mockClear();
    await createTestDb();
    const organizer = await createTestOrganizer();
    cookieJar.set(SESSION_COOKIE, await createSessionToken(organizer.id));
  });

  async function createDraft(values = draft) {
    const result = await actions.savePost({ ok: false }, form(values));
    if (!result.ok || !result.data) throw new Error(JSON.stringify(result));
    return result.data.id;
  }

  it("saves a draft with a slug from the title", async () => {
    const id = await createDraft();
    expect(await posts.getPostById(id)).toMatchObject({ status: "draft", slug: "weather-update", publishedAt: null });
    expect(await posts.listPublished(1)).toMatchObject({ posts: [], total: 0 });
  });

  it("refuses a slug another post already uses", async () => {
    await createDraft();
    const result = await actions.savePost({ ok: false }, form({ ...draft, title: "Another", slug: "weather-update" }));
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { slug: ["Another post already uses this web address. Choose a different one."] },
    });
  });

  it("adds a number when a generated slug is taken", async () => {
    await createDraft();
    const id = await createDraft();
    expect((await posts.getPostById(id))?.slug).toBe("weather-update-2");
  });

  it("publishes once, keeps the first publish date, and refreshes public pages", async () => {
    const id = await createDraft();
    expect((await actions.publishPost({ ok: false }, form({ id }))).ok).toBe(true);
    const first = (await posts.getPostById(id))!.publishedAt;
    expect(first).toBeInstanceOf(Date);
    for (const path of ["/", "/updates", "/updates/weather-update"]) {
      expect(revalidatePath).toHaveBeenCalledWith(path);
    }
    await actions.unpublishPost(form({ id }));
    expect((await posts.getPostById(id))?.status).toBe("draft");
    await actions.publishPost({ ok: false }, form({ id }));
    expect((await posts.getPostById(id))?.publishedAt).toEqual(first);
  });

  it("emails subscribers only when asked, and only once", async () => {
    const { token } = await subscription.subscribe("fan@example.com");
    await subscription.confirm(token!);
    mailer.clear();
    const id = await createDraft();

    await actions.publishPost({ ok: false }, form({ id }));
    expect(mailer.sent).toHaveLength(0);

    await actions.unpublishPost(form({ id }));
    const notified = await actions.publishPost({ ok: false }, form({ id, notifySubscribers: "on" }));
    expect(notified).toMatchObject({ ok: true, message: "Published and emailed 1 subscriber." });
    expect(mailer.sent).toHaveLength(1);

    await actions.unpublishPost(form({ id }));
    const again = await actions.publishPost({ ok: false }, form({ id, notifySubscribers: "on" }));
    expect(again).toMatchObject({ ok: true, message: "Published. Subscribers were already emailed about this post." });
    expect(mailer.sent).toHaveLength(1);
  });

  it("deletes drafts that were never published, but not posts that were", async () => {
    const neverPublished = await createDraft();
    await actions.deletePost(form({ id: neverPublished }));
    expect(await posts.getPostById(neverPublished)).toBeNull();

    const published = await createDraft({ ...draft, title: "Route change" });
    await actions.publishPost({ ok: false }, form({ id: published }));
    await actions.unpublishPost(form({ id: published }));
    await expect(posts.deletePost(published)).rejects.toThrow(/published/);
    expect(await posts.getPostById(published)).not.toBeNull();
  });

  it("refuses every action without a session", async () => {
    const id = await createDraft();
    resetCookies();
    expect(await actions.savePost({ ok: false }, form(draft))).toEqual({ ok: false, formError: "Please sign in again." });
    expect(await actions.publishPost({ ok: false }, form({ id }))).toEqual({ ok: false, formError: "Please sign in again." });
    await actions.deletePost(form({ id }));
    expect(await posts.getPostById(id)).not.toBeNull();
    expect((await posts.getPostById(id))?.status).toBe("draft");
  });

  it("lists published posts newest first, 10 per page", async () => {
    for (let i = 1; i <= 11; i++) {
      const id = await createDraft({ ...draft, title: `Update number ${i}` });
      await posts.publishPost(id, new Date(Date.UTC(2026, 8, i)));
    }
    const page1 = await posts.listPublished(1);
    expect(page1.total).toBe(11);
    expect(page1.posts).toHaveLength(10);
    expect(page1.posts[0]?.title).toBe("Update number 11");
    const page2 = await posts.listPublished(2);
    expect(page2.posts.map((p) => p.title)).toEqual(["Update number 1"]);
    expect((await posts.getLatestPublished())?.title).toBe("Update number 11");
  });
});

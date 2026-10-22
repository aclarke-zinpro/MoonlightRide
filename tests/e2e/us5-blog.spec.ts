import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

async function createDraft(page: Page, title: string, body = "Update body text.") {
  await page.goto("/admin/posts/new");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel(/^Summary/).fill(`Summary of ${title}.`);
  await page.getByRole("textbox", { name: /^Body/ }).fill(body);
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.waitForURL(/\/admin\/posts\/[0-9a-f-]{36}/);
  return page.url();
}

async function publish(page: Page) {
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Published" })).toBeVisible();
}

const slugOf = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

test.describe("US5 Read and publish ride updates", () => {
  test("scenario 5: signed-out visitors are sent to sign in", async ({ page }) => {
    await page.goto("/admin/posts");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fposts/);
  });

  test("scenarios 1-3: drafts stay hidden; publishing, editing, and unpublishing show on the site", async ({ page, browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Creates shared posts; run once.");
    const title = "Weather call for Saturday";
    const slug = slugOf(title);
    await signIn(page, "/admin/posts");
    await createDraft(page, title, "Skies look **clear**.");

    const visitor = await (await browser.newContext()).newPage();
    expect((await visitor.goto(`/updates/${slug}`))?.status()).toBe(404);

    await publish(page);
    await visitor.goto("/updates");
    await expect(visitor.getByRole("article").first()).toContainText(title);
    await visitor.goto(`/updates/${slug}`);
    await expect(visitor.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(visitor.locator("strong", { hasText: "clear" })).toBeVisible();
    await visitor.goto("/");
    await expect(visitor.getByRole("link", { name: title })).toBeVisible();

    await page.getByRole("textbox", { name: /^Body/ }).fill("Skies look clear. Bring a jacket.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
    await visitor.goto(`/updates/${slug}`);
    await expect(visitor.getByText("Bring a jacket.")).toBeVisible();

    await page.getByRole("button", { name: "Unpublish" }).click();
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
    expect((await visitor.goto(`/updates/${slug}`))?.status()).toBe(404);

    await publish(page);
  });

  test("scenario 4: more than 10 posts are paginated 10 per page, newest first", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Creates shared posts; run once.");
    await signIn(page, "/admin/posts");
    for (let i = 1; i <= 11; i++) {
      await createDraft(page, `Pagination post ${i}`);
      await publish(page);
    }
    await page.goto("/updates");
    await expect(page.getByRole("article")).toHaveCount(10);
    await expect(page.getByRole("article").first()).toContainText("Pagination post 11");
    await page.getByRole("link", { name: "Older updates" }).click();
    await expect(page).toHaveURL(/\/updates\?page=2/);
    expect(await page.getByRole("article").count()).toBeGreaterThanOrEqual(1);
    expect((await page.goto("/updates?page=99"))?.status()).toBe(404);
  });

  test("accessibility: the updates list and a post page have no serious WCAG violations", async ({ page }) => {
    await page.goto("/updates");
    await expectNoA11yViolations(page);
    const first = page.getByRole("article").first().getByRole("link").first();
    if (await first.count()) {
      await first.click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoA11yViolations(page);
    }
  });
});

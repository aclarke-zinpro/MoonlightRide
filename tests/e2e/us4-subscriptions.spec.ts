import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { lastLinkTo, messagesTo } from "../helpers/outbox";
import { signIn, waitLikeAHuman } from "./helpers";

test.describe.configure({ mode: "serial" });

const NEUTRAL = "Thanks! Check your email to confirm your subscription.";

test.describe("US4 Sign up for ride updates", () => {
  const fan = (project: string) => `fan-${project}@e2e.test`;

  test("scenarios 1-2: subscribe from the footer and confirm by email", async ({ page }, testInfo) => {
    const email = fan(testInfo.project.name);
    await page.goto("/route");
    const footer = page.getByRole("region", { name: "Get ride updates" });
    await footer.getByLabel("Email for updates").fill(email);
    await waitLikeAHuman(page);
    await footer.getByRole("button", { name: "Sign me up" }).click();
    await expect(footer.getByText(NEUTRAL)).toBeVisible();

    await expect.poll(() => messagesTo(email).length).toBe(1);
    const confirmPath = lastLinkTo(email, "/subscribe/confirm/");
    await page.goto(confirmPath!);
    await expect(page.getByRole("heading", { name: "You're subscribed!" })).toBeVisible();
  });

  test("scenario 5: submitting an active email again shows the same message and sends nothing", async ({ page }, testInfo) => {
    const email = fan(testInfo.project.name);
    await page.goto("/");
    const footer = page.getByRole("region", { name: "Get ride updates" });
    await footer.getByLabel("Email for updates").fill(email);
    await waitLikeAHuman(page);
    await footer.getByRole("button", { name: "Sign me up" }).click();
    await expect(footer.getByText(NEUTRAL)).toBeVisible();
    expect(messagesTo(email)).toHaveLength(1);
  });

  test("scenarios 3-4: a post emailed to subscribers arrives once, and unsubscribing stops the next one", async ({ page }, testInfo) => {
    const email = fan(testInfo.project.name);
    await signIn(page, "/admin/posts/new");

    const publishWithEmail = async (title: string) => {
      await page.goto("/admin/posts/new");
      await page.getByLabel("Title").fill(title);
      await page.getByLabel(/^Summary/).fill("A quick update for subscribers.");
      await page.getByRole("textbox", { name: /^Body/ }).fill("Lights charged? See you there.");
      await page.getByRole("button", { name: "Save draft" }).click();
      await page.waitForURL(/\/admin\/posts\/[0-9a-f-]{36}/);
      await page.getByLabel("Email this post to subscribers").check();
      await page.getByRole("button", { name: "Publish" }).click();
      await expect(page.getByRole("status").filter({ hasText: /Published and emailed/ })).toBeVisible();
    };

    await publishWithEmail(`Subscriber update ${testInfo.project.name}`);
    await expect.poll(() => messagesTo(email).filter((m) => m.subject.startsWith("Subscriber update")).length).toBe(1);

    const unsubscribePath = lastLinkTo(email, "/unsubscribe/");
    await page.goto(unsubscribePath!);
    await page.getByRole("button", { name: "Unsubscribe" }).click();
    await expect(page.getByText("You're unsubscribed.")).toBeVisible();

    await publishWithEmail(`Second update ${testInfo.project.name}`);
    expect(messagesTo(email).filter((m) => m.subject.startsWith("Second update"))).toHaveLength(0);
  });

  test("scenario 6: the organizer sees the subscriber count and can export the list", async ({ page }, testInfo) => {
    await signIn(page, "/admin/subscribers");
    await page.goto("/admin/subscribers?status=all");
    await expect(page.getByTestId("active-subscribers")).toHaveText(/\d+ active subscribers?/);
    await expect(page.getByRole("cell", { name: fan(testInfo.project.name) })).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download CSV" }).click();
    const csv = readFileSync(await (await download).path(), "utf8");
    expect(csv).toContain("Email,Status,Confirmed At");
    expect(csv).toContain(fan(testInfo.project.name));
  });
});

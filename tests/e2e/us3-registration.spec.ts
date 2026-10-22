import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { lastLinkTo, messagesTo } from "../helpers/outbox";
import { expectNoA11yViolations, signIn, waitLikeAHuman } from "./helpers";

test.describe.configure({ mode: "serial" });

async function fillRegistration(page: Page, email: string, overrides: Partial<Record<string, string>> = {}) {
  await page.getByLabel("Full name").fill(overrides.fullName ?? "Riley Rider");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel(/^Phone/).fill("507-555-0100");
  await page.getByLabel("Emergency contact name").fill("Sam Rider");
  await page.getByLabel("Emergency contact phone").fill("507-555-0199");
  await page.getByLabel("Riders in your party").selectOption(overrides.partySize ?? "2");
  await page.getByLabel(/I have read and accept the waiver/).check();
}

test.describe("US3 Register for the ride", () => {
  // Each project gets its own riders so mobile and desktop runs don't collide.
  const rider = (project: string, name: string) => `${name}-${project}@e2e.test`;

  test("setup: organizer approves the waiver and opens registration", async ({ page }) => {
    await signIn(page, "/admin/ride");
    await page.goto("/admin/ride");
    const waiver = page.getByRole("region", { name: "Waiver" });
    if (await waiver.getByRole("button", { name: "Approve this version" }).isVisible()) {
      await waiver.getByRole("button", { name: "Approve this version" }).click();
      await expect(waiver.getByText(/Approved/)).toBeVisible();
    }
    const settings = page.getByRole("region", { name: "Registration settings" });
    await settings.getByLabel("Registration is open").check();
    await settings.getByLabel("Capacity").fill("");
    await settings.getByRole("button", { name: "Save registration settings" }).click();
    await expect(settings.getByRole("status")).toContainText("Registration settings saved.");
  });

  test("scenario 7: the full waiver is shown and must be accepted", async ({ page }) => {
    await page.goto("/register");
    const waiver = page.getByRole("region", { name: "Ride waiver" });
    await expect(waiver).toContainText("Release and assumption of risk");
    await waitLikeAHuman(page);
    await page.getByLabel("Full name").fill("No Waiver");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("You need to accept the waiver to register.")).toBeVisible();
  });

  test("scenario 2: invalid input shows field errors and keeps values", async ({ page }) => {
    await page.goto("/register");
    await waitLikeAHuman(page);
    await page.getByLabel("Full name").fill("Kept Name");
    await page.getByLabel("Email", { exact: true }).fill("not-an-email");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Enter an email address like name@example.com.")).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Full name")).toHaveValue("Kept Name");
  });

  test("scenarios 1 and 3: register, get the confirmation email, and duplicates are refused", async ({ page }, testInfo) => {
    const email = rider(testInfo.project.name, "riley");
    await page.goto("/register");
    await fillRegistration(page, email);
    await waitLikeAHuman(page);
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("heading", { name: "You're registered!" })).toBeVisible();

    await expect.poll(() => messagesTo(email).length).toBe(1);
    const message = messagesTo(email)[0]!;
    expect(message.subject).toMatch(/You're registered for Moonlight Ride/);
    expect(message.text).toContain("Carleton Arboretum North Trailhead");
    expect(message.text).toMatch(/headlight and taillight/);

    await page.goto("/register");
    await fillRegistration(page, email);
    await waitLikeAHuman(page);
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText(/already registered for this year's ride/)).toBeVisible();
  });

  test("accessibility: the register page has no serious WCAG violations", async ({ page }) => {
    await page.goto("/register");
    await expectNoA11yViolations(page);
  });

  test("scenarios 4 and 6: the organizer sees the total and CSV; the cancel link lowers it", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Counts depend on both projects' riders; run once.");
    const email = rider(testInfo.project.name, "riley");
    await signIn(page, "/admin/registrations");
    await page.goto("/admin/registrations");
    const total = page.getByTestId("rider-total");
    const riders = async () => Number((await total.textContent())?.match(/\d+/)?.[0]);
    // Both projects registered a party of 2; other specs may have added riders too.
    const before = await riders();
    expect(before).toBeGreaterThanOrEqual(4);
    await expect(page.getByRole("cell", { name: email })).toBeVisible();

    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download CSV" }).click();
    const file = await (await download).path();
    const csv = readFileSync(file, "utf8");
    expect(csv).toContain("Registered At,Full Name,Email");
    expect(csv).toContain(email);

    const cancelPath = lastLinkTo(email, "/register/cancel/");
    expect(cancelPath).toBeTruthy();
    await page.goto(cancelPath!);
    await page.getByRole("button", { name: "Cancel my registration" }).click();
    await expect(page.getByText("Your registration is cancelled.")).toBeVisible();

    await page.goto("/admin/registrations");
    await expect(total).toHaveText(`${before - 2} riders`);
  });

  test("scenario 5: closing registration replaces the form with a message", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Changes shared state; run once at the end.");
    await signIn(page, "/admin/ride");
    await page.goto("/admin/ride");
    const settings = page.getByRole("region", { name: "Registration settings" });
    await settings.getByLabel("Registration is open").uncheck();
    await settings.getByRole("button", { name: "Save registration settings" }).click();
    await expect(settings.getByRole("status")).toContainText("Registration settings saved.");

    await page.goto("/register");
    await expect(page.getByText(/Registration is closed/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Register" })).toHaveCount(0);

    // Re-open for any later tests.
    await page.goto("/admin/ride");
    await settings.getByLabel("Registration is open").check();
    await settings.getByRole("button", { name: "Save registration settings" }).click();
    await expect(settings.getByRole("status")).toContainText("Registration settings saved.");
  });
});

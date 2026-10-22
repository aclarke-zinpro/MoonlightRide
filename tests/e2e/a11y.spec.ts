import { expect, test } from "@playwright/test";
import { ensureRegistrationOpen, expectNoA11yViolations, waitLikeAHuman } from "./helpers";

const PUBLIC_PAGES = [
  "/",
  "/route",
  "/register",
  "/updates",
  "/register/cancel/not-a-real-token",
  "/subscribe/confirm/not-a-real-token",
  "/unsubscribe/not-a-real-token",
  "/this-page-does-not-exist",
  "/admin/login",
];

test.describe("Accessibility and responsiveness across the site", () => {
  for (const path of PUBLIC_PAGES) {
    test(`no serious WCAG 2.2 AA violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expectNoA11yViolations(page);
    });
  }

  test("no horizontal scrolling at 320 px wide", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Viewport check runs once.");
    await page.setViewportSize({ width: 320, height: 700 });
    for (const path of PUBLIC_PAGES) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
    }
  });

  test("a rider can register using only the keyboard", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Registers a rider; run once.");
    await ensureRegistrationOpen(page);
    await page.context().clearCookies();
    await page.goto("/register");
    await page.getByLabel("Full name").focus();
    await page.keyboard.type("Kim Keyboard");
    await page.keyboard.press("Tab");
    await page.keyboard.type("kim-keyboard@e2e.test");
    await page.keyboard.press("Tab");
    await page.keyboard.type("507-555-0111");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Riders in your party")).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.type("Pat Keyboard");
    await page.keyboard.press("Tab");
    await page.keyboard.type("507-555-0112");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("region", { name: "Ride waiver" })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Space");
    await expect(page.getByLabel(/I have read and accept the waiver/)).toBeChecked();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Register" })).toBeFocused();
    await waitLikeAHuman(page);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "You're registered!" })).toBeVisible();
  });
});

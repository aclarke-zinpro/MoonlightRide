import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("US1 Learn about this year's ride", () => {
  test("scenario 1: title, date, start time, and location are in the first screen", async ({ page }) => {
    await page.goto("/");
    const viewport = page.viewportSize();
    for (const locator of [
      page.getByRole("heading", { level: 1, name: /Moonlight Ride 2026/ }),
      page.getByTestId("ride-date"),
      page.getByTestId("ride-time"),
      page.getByTestId("ride-location"),
    ]) {
      await expect(locator).toBeVisible();
      const box = await locator.boundingBox();
      expect(box && viewport && box.y + box.height).toBeLessThanOrEqual(viewport?.height ?? 0);
    }
    await expect(page.getByTestId("ride-time")).toHaveText(/6:00 PM C[DS]T/);
    await expect(page.getByTestId("ride-location")).toContainText("Carleton Arboretum North Trailhead");
  });

  test("scenario 2: route summary, preparation, and parking guidance", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("15.8 miles")).toBeVisible();
    await expect(page.getByText("77% gravel")).toBeVisible();
    await expect(page.getByText("6% doubletrack trail")).toBeVisible();
    await expect(page.getByText("17% paved")).toBeVisible();
    await expect(page.getByText("305 ft elevation gain")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ride prep" })).toBeVisible();
    await expect(page.getByText(/fully charged headlight and taillight/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Parking" })).toBeVisible();
    await expect(page.getByText(/Additional parking is on the north side/)).toBeVisible();
  });

  test("scenario 3: a countdown shows before ride day", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("countdown")).toHaveText(/\d+ days? to go/);
    // The call to action is styled as a burnt-orange button (regression: server-rendered styles).
    await expect(page.getByRole("link", { name: "Register for the ride" })).toHaveCSS(
      "background-color",
      "rgb(217, 119, 43)",
    );
  });

  test("accessibility: the home page has no serious WCAG violations", async ({ page }) => {
    await page.goto("/");
    await expectNoA11yViolations(page);
  });

  test("scenarios 4-5: organizer edits flow to the home page, including the past-ride state", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Edits shared state; run once.");
    await signIn(page, "/admin/ride");
    await page.goto("/admin/ride");

    // Scenario 5: change the start location.
    await page.getByLabel("Start location name").fill("Waterford Bridge Lot");
    await page.getByRole("button", { name: "Save ride details" }).click();
    await expect(page.getByRole("status")).toContainText("Ride details saved.");
    await page.goto("/");
    await expect(page.getByTestId("ride-location")).toContainText("Waterford Bridge Lot");

    // Scenario 4: move the ride into the past.
    await page.goto("/admin/ride");
    const originalDate = await page.getByLabel("Date", { exact: true }).inputValue();
    await page.getByLabel("Date", { exact: true }).fill("2020-10-24");
    await page.getByRole("button", { name: "Save ride details" }).click();
    await expect(page.getByRole("status")).toContainText("Ride details saved.");
    await page.goto("/");
    await expect(page.getByTestId("countdown")).toHaveText("This year's ride has happened");
    await expect(page.getByRole("link", { name: /sign up for updates/i })).toBeVisible();

    // Restore for the other stories' tests.
    await page.goto("/admin/ride");
    await page.getByLabel("Date", { exact: true }).fill(originalDate);
    await page.getByLabel("Start location name").fill("Carleton Arboretum North Trailhead");
    await page.getByRole("button", { name: "Save ride details" }).click();
    await expect(page.getByRole("status")).toContainText("Ride details saved.");
  });
});

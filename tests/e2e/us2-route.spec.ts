import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, signIn } from "./helpers";

test.describe("US2 Explore the route, directions, and stops", () => {
  test("scenario 1: the map embeds the RideWithGPS route and links to the event", async ({ page }) => {
    await page.goto("/route");
    const frame = page.locator('iframe[title^="Route map for Moonlight Ride"]');
    await expect(frame).toHaveAttribute("src", /id=57148740/);
    await expect(page.getByRole("link", { name: /open the full route on ridewithgps/i })).toHaveAttribute(
      "href",
      "https://ridewithgps.com/events/502033-moonlight-ridge-2026",
    );
  });

  test("scenario 2: every cue in order, with Important and Optional labels", async ({ page }) => {
    await page.goto("/route");
    const cues = page.getByRole("list", { name: /turn-by-turn/i }).getByRole("listitem");
    await expect(cues).toHaveCount(14);
    await expect(cues.first()).toContainText("Head east on 320th Street");
    await expect(cues.last()).toContainText("the parking lot where we started");
    const offRoad = cues.filter({ hasText: "we go off-road here" });
    await expect(offRoad).toContainText("Important");
    const detour = cues.filter({ hasText: "4th Ave" });
    await expect(detour).toContainText("Optional");
    await expect(detour).toContainText("Mile 5.8");
  });

  test("scenario 3: the stops list shows each stop with its mile", async ({ page }) => {
    await page.goto("/route");
    const stops = page.getByRole("list", { name: /stops along the way/i }).getByRole("listitem");
    await expect(stops).toHaveCount(6);
    for (const [name, mile] of [
      ["Cannon River access", "Mile 5.8"],
      ["Convenience store", "Mile 8.2"],
      ["R Bar, Randolph", "Mile 8.7"],
      ["River beach", "Mile 10"],
    ] as const) {
      const stop = stops.filter({ hasText: name });
      await expect(stop).toContainText(mile);
    }
    await expect(stops.filter({ hasText: "River beach" })).toContainText("Fire if conditions allow");
    await expect(stops.filter({ hasText: "Cannon River access" })).toContainText("Optional");
  });

  test("scenario 4: when the map is unavailable, the fallback image and cue sheet still show", async ({ page }) => {
    await page.route(/ridewithgps\.com/, (route) => route.abort());
    await page.goto("/route");
    await expect(page.getByRole("img", { name: /route map/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/couldn't load the interactive map/i)).toBeVisible();
    await expect(page.getByRole("list", { name: /turn-by-turn/i }).getByRole("listitem")).toHaveCount(14);
  });

  test("accessibility: the route page has no serious WCAG violations", async ({ page }) => {
    await page.goto("/route");
    await expectNoA11yViolations(page);
  });

  test("scenario 5: an organizer edit to a stop shows on the route page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Edits shared state; run once.");
    await signIn(page, "/admin/route");
    await page.goto("/admin/route");
    const stop = page.getByRole("group", { name: "Stop: R Bar, Randolph" });
    await stop.getByRole("textbox", { name: /^Description/ }).fill("Bar and grill in Randolph. Kitchen open late.");
    await stop.getByRole("button", { name: "Save stop" }).click();
    await expect(stop.getByRole("status")).toContainText("Saved.");
    await page.goto("/route");
    await expect(page.getByText("Kitchen open late.")).toBeVisible();
  });
});

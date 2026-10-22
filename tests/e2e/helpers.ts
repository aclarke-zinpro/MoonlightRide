import { readFileSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export function organizerCredentials(): { email: string; password: string } {
  return JSON.parse(readFileSync(path.join(process.cwd(), ".e2e/organizer.json"), "utf8"));
}

export async function signIn(page: Page, next = "/admin") {
  const { email, password } = organizerCredentials();
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin") && url.pathname !== "/admin/login");
}

/** Fails the test on any serious or critical WCAG 2.2 AA violation. */
export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .exclude("iframe")
    .analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`),
  ).toEqual([]);
}

/** Public forms reject submissions made in under 3 seconds (spam check), so wait like a person. */
export async function waitLikeAHuman(page: Page) {
  await page.waitForTimeout(3_200);
}

/** Signs in, approves the current waiver if needed, and opens registration with no capacity. */
export async function ensureRegistrationOpen(page: Page) {
  await signIn(page, "/admin/ride");
  await page.goto("/admin/ride");
  const waiver = page.getByRole("region", { name: "Waiver" });
  const approve = waiver.getByRole("button", { name: "Approve this version" });
  if (await approve.isVisible()) {
    await approve.click();
    await expect(waiver.getByText(/Approved/)).toBeVisible();
  }
  const settings = page.getByRole("region", { name: "Registration settings" });
  await settings.getByLabel("Registration is open").check();
  await settings.getByLabel("Capacity").fill("");
  await settings.getByRole("button", { name: "Save registration settings" }).click();
  await expect(settings.getByRole("status")).toContainText("Registration settings saved.");
}

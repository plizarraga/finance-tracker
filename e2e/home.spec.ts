import { test, expect } from "@playwright/test";

test("landing page renders", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Finance Tracker SLC" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
});

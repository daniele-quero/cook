import { expect, test } from "@playwright/test";

test("home page loads and shows the site brand", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Danio Cooks/);
  await expect(page.getByText("Danio Cooks").first()).toBeVisible();
});

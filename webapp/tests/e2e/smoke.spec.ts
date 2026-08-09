import { expect, test } from "@playwright/test";

test("home page loads and shows the site brand", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Danio Cooks/);
  await expect(page.getByText("Danio Cooks").first()).toBeVisible();
});

test("recipe card thumbnail and arrow open the recipe detail", async ({ page }) => {
  await page.goto("/");

  const thumbnail = page.locator(".recipe-card").first().locator("a.recipe-image");
  await expect(thumbnail).toHaveAccessibleName(/Apri/);
  const thumbnailHref = await thumbnail.getAttribute("href");

  if (!thumbnailHref) {
    throw new Error("Recipe thumbnail has no destination");
  }

  await thumbnail.click();
  await expect(page).toHaveURL(new URL(thumbnailHref, "http://localhost:3000").toString());

  await page.goto("/");

  const arrow = page.locator(".recipe-card").first().locator(".recipe-card-footer a");
  const arrowHref = await arrow.getAttribute("href");

  if (!arrowHref) {
    throw new Error("Recipe card arrow has no destination");
  }

  expect(arrowHref).toBe(thumbnailHref);
  await arrow.click();
  await expect(page).toHaveURL(new URL(arrowHref, "http://localhost:3000").toString());
});

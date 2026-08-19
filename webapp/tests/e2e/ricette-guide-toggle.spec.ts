import { expect, test } from "@playwright/test";

async function columnCount(page: import("@playwright/test").Page) {
  return page.locator(".tag-bucket-grid").evaluate((element) => {
    return window.getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length;
  });
}

test("the mobile header hides the recipe/guide switch while the search overlay keeps the scope toggle", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto("/");

  await expect(page.locator(".header-search-scope")).toHaveCount(0);

  await page.locator("button.header-search").click();

  const dialog = page.locator(".search-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Cerca una ricetta");
  await expect(dialog.locator(".search-dialog-heading .eyebrow")).toHaveText("Ricettario");

  const recipeOption = dialog.locator(".search-scope-option", { hasText: "Ricette" });
  const guideOption = dialog.locator(".search-scope-option", { hasText: "Guide tematiche" });
  await expect(recipeOption).toHaveClass(/is-selected/);
  await expect(recipeOption.locator("input")).toBeChecked();

  await guideOption.click();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Cerca una guida");
  await expect(dialog.locator(".search-dialog-heading .eyebrow")).toHaveText("Guide tematiche");
  await expect(guideOption).toHaveClass(/is-selected/);
  await expect(guideOption.locator("input")).toBeChecked();

  await page.locator(".dialog-close").click();
  await expect(page.locator(".search-dialog")).not.toBeVisible();
});

test("the tag summary grid keeps the premium 4-column layout across desktop, tablet and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.locator(".result-view-toggle button").filter({ hasText: "Raggruppa per tag" }).first().click();

  await expect(page.locator(".tag-bucket-card").first()).toBeVisible();
  expect(await columnCount(page)).toBe(4);

  await page.setViewportSize({ width: 900, height: 900 });
  expect(await columnCount(page)).toBe(4);

  await page.setViewportSize({ width: 700, height: 900 });
  expect(await columnCount(page)).toBe(4);
});

test("tag summary cards show only the count and keep long labels readable", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.locator(".result-view-toggle button").filter({ hasText: "Raggruppa per tag" }).first().click();

  const firstCard = page.locator(".tag-bucket-card").first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard.locator(".tag-bucket-card__count")).not.toHaveText(/elemento|elementi/);
  await expect(firstCard.locator(".tag-bucket-card__count")).toHaveText(/^\d+$/);

  const icons = page.locator(".tag-bucket-card__icon svg");
  const iconCount = await icons.count();
  expect(iconCount).toBeGreaterThan(3);

  const markups = await icons.evaluateAll((svgs) => svgs.slice(0, Math.min(svgs.length, 8)).map((svg) => svg.innerHTML));
  expect(new Set(markups).size).toBeGreaterThan(1);
});

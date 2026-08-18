import { expect, test } from "@playwright/test";

async function columnCount(page: import("@playwright/test").Page) {
  return page.locator(".tag-bucket-grid").evaluate((element) => {
    return window.getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length;
  });
}

test("the Ricette/Guide scope toggle stays in sync between the header pill and the search overlay", async ({ page }) => {
  // Larghezza tablet: qui e' visibile la pill "Ricette/Guide" nell'header in cima
  // (nascosta invece sopra i 960px, dove resta solo il toggle dentro l'overlay).
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto("/");

  const headerScope = page.locator(".header-search-scope");
  const ricetteButton = headerScope.getByRole("button", { name: "Ricette" });
  const guideButton = headerScope.getByRole("button", { name: "Guide" });

  await expect(ricetteButton).toHaveClass(/is-selected/);
  await expect(ricetteButton).toHaveAttribute("aria-pressed", "true");
  await expect(guideButton).not.toHaveClass(/is-selected/);

  await guideButton.click();
  await expect(guideButton).toHaveClass(/is-selected/);
  await expect(guideButton).toHaveAttribute("aria-pressed", "true");
  await expect(ricetteButton).not.toHaveClass(/is-selected/);

  await page.locator("button.header-search").click();

  const dialog = page.locator(".search-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Cerca una guida");
  await expect(dialog.locator(".search-dialog-heading .eyebrow")).toHaveText("Guide tematiche");

  const guideOption = dialog.locator(".search-scope-option", { hasText: "Guide tematiche" });
  const recipeOption = dialog.locator(".search-scope-option", { hasText: "Ricette" });
  await expect(guideOption).toHaveClass(/is-selected/);
  await expect(guideOption.locator("input")).toBeChecked();

  // Torna a "Ricette" dall'overlay: l'header deve restare sincronizzato.
  await recipeOption.click();
  await expect(recipeOption).toHaveClass(/is-selected/);
  await expect(dialog).toBeVisible();

  await page.locator(".dialog-close").click();
  await expect(ricetteButton).toHaveClass(/is-selected/);
  await expect(guideButton).not.toHaveClass(/is-selected/);
});

test("the tag summary grid keeps the premium 4-column desktop layout and reduces cleanly on tablet/mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Raggruppa per tag" }).click();

  await expect(page.locator(".tag-bucket-card").first()).toBeVisible();
  expect(await columnCount(page)).toBe(4);

  await page.setViewportSize({ width: 900, height: 900 });
  expect(await columnCount(page)).toBe(3);

  await page.setViewportSize({ width: 700, height: 900 });
  expect(await columnCount(page)).toBe(2);
});

test("tag summary cards use more than one distinct icon instead of a single generic icon for every tag", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Raggruppa per tag" }).click();

  const icons = page.locator(".tag-bucket-card__icon svg");
  const iconCount = await icons.count();
  expect(iconCount).toBeGreaterThan(3);

  const markups = await icons.evaluateAll((svgs) => svgs.slice(0, Math.min(svgs.length, 8)).map((svg) => svg.innerHTML));
  expect(new Set(markups).size).toBeGreaterThan(1);
});

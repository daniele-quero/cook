import { expect, test } from "@playwright/test";

const recipeSlug = "polpo-sous-vide";
const recipeTitle = "Polpo sous-vide";
const guideSlug = "risotto-tecnica-mantecatura";
const guideTitle = "Risotto: tecnica e mantecatura";

test("visiting a recipe and a guide populates the Recenti section, most recent first", async ({ page }) => {
  await page.goto(`/recipes/${recipeSlug}`);
  await expect(page.getByRole("heading", { level: 1, name: recipeTitle })).toBeVisible();

  await page.goto(`/guides/${guideSlug}`);
  await expect(page.getByRole("heading", { level: 1, name: guideTitle })).toBeVisible();

  await page.goto("/");
  const recentSection = page.locator("#recenti");
  await expect(recentSection).toBeVisible();

  const cards = recentSection.locator(".recipe-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0).locator("h3")).toHaveText(guideTitle);
  await expect(cards.nth(0).locator(".recent-kind-tag")).toHaveText("Guida");
  await expect(cards.nth(1).locator("h3")).toHaveText(recipeTitle);
  await expect(cards.nth(1).locator(".recent-kind-tag")).toHaveText("Ricetta");
});

test("revisiting an already recent recipe moves it back to the top without duplicating it", async ({ page }) => {
  await page.goto(`/recipes/${recipeSlug}`);
  await expect(page.getByRole("heading", { level: 1, name: recipeTitle })).toBeVisible();

  await page.goto(`/guides/${guideSlug}`);
  await expect(page.getByRole("heading", { level: 1, name: guideTitle })).toBeVisible();

  await page.goto(`/recipes/${recipeSlug}`);
  await expect(page.getByRole("heading", { level: 1, name: recipeTitle })).toBeVisible();

  await page.goto("/");
  const recentSection = page.locator("#recenti");
  const cards = recentSection.locator(".recipe-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0).locator("h3")).toHaveText(recipeTitle);
  await expect(cards.nth(1).locator("h3")).toHaveText(guideTitle);
});

test("the Recenti section shows an empty state before any recipe or guide has been visited", async ({ page }) => {
  await page.goto("/");
  const recentSection = page.locator("#recenti");
  await expect(recentSection).toBeVisible();
  await expect(recentSection.getByText("Nessun elemento recente")).toBeVisible();
  await expect(recentSection.locator(".recipe-card")).toHaveCount(0);
});

test("the Recenti section ignores corrupted localStorage data instead of crashing", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.setItem("danio-cooks:recent-items", "{not-json");
  });

  await page.reload();
  const recentSection = page.locator("#recenti");
  await expect(recentSection.getByText("Nessun elemento recente")).toBeVisible();
});

test("mobile bottom nav exposes a fifth Recenti button with a clock icon, right before Cerca", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const navItems = page.locator(".mobile-nav a, .mobile-nav button");
  await expect(navItems).toHaveCount(5);
  await expect(navItems.nth(3)).toHaveText(/Recenti/);
  await expect(navItems.nth(4)).toHaveText(/Cerca/);

  const recentLink = page.locator(".mobile-nav a", { hasText: "Recenti" });
  await expect(recentLink).toHaveAccessibleName("Recenti");
  await expect(recentLink.locator("svg")).toBeVisible();

  await recentLink.click();
  await expect(page).toHaveURL(/\/#recenti$/);
  await expect(recentLink).toHaveClass(/nav-active/);

  const guideLink = page.locator(".mobile-nav a", { hasText: "Guide" });
  await expect(guideLink).not.toHaveClass(/nav-active/);
});

test("the burger menu drawer also exposes the Recenti link", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Apri menu" }).click();
  const drawer = page.locator(".mobile-drawer");
  const recentLink = drawer.getByRole("link", { name: "Recenti" });
  await expect(recentLink).toBeVisible();

  await recentLink.click();
  await expect(page).toHaveURL(/\/#recenti$/);
  await expect(page.locator(".mobile-drawer")).not.toHaveClass(/is-open/);
});

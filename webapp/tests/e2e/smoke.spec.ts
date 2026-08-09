import { expect, test } from "@playwright/test";

test("home page loads and shows the site brand", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Danio Cooks/);
  await expect(page.getByText("Danio Cooks").first()).toBeVisible();
});

test("home content is server rendered and its search, tags, and images work", async ({ page }) => {
  const response = await page.request.get("/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(html).toContain("recipe-grid");
  expect(html).toContain('"@type":"WebSite"');
  expect(html).toContain('"@type":"CollectionPage"');

  await page.goto("/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /logo-danio-cooks\.png/);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", /logo-danio-cooks\.png/);

  const cards = page.locator(".recipe-card");
  const initialCardCount = await cards.count();
  expect(initialCardCount).toBeGreaterThan(1);

  const firstCard = cards.first();
  const recipeTitle = await firstCard.locator("h3").textContent();
  if (!recipeTitle) {
    throw new Error("The first recipe card has no title");
  }

  const thumbnailImage = firstCard.locator("a.recipe-image img");
  await expect(thumbnailImage).toBeVisible();
  await expect(thumbnailImage).toHaveAttribute("alt", recipeTitle);
  expect(await thumbnailImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

  const searchField = page.getByRole("searchbox", { name: "Cerca ricette, ingredienti o tecniche" });
  await searchField.fill(recipeTitle);
  await expect.poll(() => cards.count()).toBeLessThan(initialCardCount);
  await expect(cards.first().locator("h3")).toHaveText(recipeTitle);

  await page.goto(`/?q=${encodeURIComponent(recipeTitle)}`);
  await expect(searchField).toHaveValue(recipeTitle);
  await expect(cards.first().locator("h3")).toHaveText(recipeTitle);

  await page.goto("/");
  const tagButton = page.locator(".tag-list button").nth(1);
  const tagName = await tagButton.textContent();
  if (!tagName) {
    throw new Error("The first recipe tag is missing");
  }

  await tagButton.click();
  await expect(tagButton).toHaveClass(/tag-active/);
  const filteredCardCount = await cards.count();
  expect(filteredCardCount).toBeGreaterThan(0);

  for (let index = 0; index < filteredCardCount; index += 1) {
    await expect(cards.nth(index).locator(".card-tags")).toContainText(tagName);
  }
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

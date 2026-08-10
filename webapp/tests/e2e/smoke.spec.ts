import { expect, test } from "@playwright/test";

const homeTitle = "Danio Cooks | Ricette tecniche, sous-vide e tempi chiari";
const homeDescription =
  "Ricette tecniche di pasta, verdure, carne e pesce, dal sous-vide al microonde e alla vasocottura, con tempi chiari e passaggi da seguire.";
const homeIntroduction =
  "Ricette tecniche, tempi chiari e passaggi da seguire senza fretta. Dal sous-vide al microonde, dalle salse ai contorni, qui trovi ricette ordinate per tecnica, tempi e passaggi essenziali. Per chi vuole capire cosa fa in cucina, senza aggiungere complicazioni inutili.";

test("home page loads and shows the site brand", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Danio Cooks/);
  await expect(page.getByText("Danio Cooks").first()).toBeVisible();
});

test("home page exposes its SEO copy and recipe introduction", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(homeTitle);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", homeDescription);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", homeTitle);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", homeDescription);
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", homeTitle);
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute("content", homeDescription);
  await expect(page.getByRole("heading", { level: 1, name: "Quale ricetta cucini oggi?" })).toBeVisible();
  await expect(page.locator(".search-intro > p:not(.eyebrow)")).toHaveText(homeIntroduction);

  const structuredDataText = await page.locator('script[type="application/ld+json"]').textContent();
  if (!structuredDataText) {
    throw new Error("The home page is missing its structured data");
  }

  const structuredData = JSON.parse(structuredDataText) as {
    "@graph": Array<{ "@type": string; description?: string }>;
  };
  const collectionPage = structuredData["@graph"].find((item) => item["@type"] === "CollectionPage");
  expect(collectionPage?.description).toBe(homeDescription);
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
  const origin = new URL(page.url()).origin;

  const thumbnail = page.locator(".recipe-card").first().locator("a.recipe-image");
  await expect(thumbnail).toHaveAccessibleName(/Apri/);
  const thumbnailHref = await thumbnail.getAttribute("href");

  if (!thumbnailHref) {
    throw new Error("Recipe thumbnail has no destination");
  }

  await thumbnail.click();
  await expect(page).toHaveURL(new URL(thumbnailHref, origin).toString());

  await page.goto("/");

  const arrow = page.locator(".recipe-card").first().locator(".recipe-card-footer a");
  const arrowHref = await arrow.getAttribute("href");

  if (!arrowHref) {
    throw new Error("Recipe card arrow has no destination");
  }

  expect(arrowHref).toBe(thumbnailHref);
  await arrow.click();
  await expect(page).toHaveURL(new URL(arrowHref, origin).toString());
});

test("kale chips recipe loads its gourmet thumbnail", async ({ page }) => {
  const thumbnailPath = "/gourmet/chips-cavolo-nero-terracotta.jpg";
  const thumbnailResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === thumbnailPath,
  );

  await page.goto("/recipes/chips-croccanti-cavolo-nero");
  await expect(page.getByRole("heading", { level: 1, name: "Chips di cavolo nero" })).toBeVisible();
  await expect(page.locator(".recipe-hero-image")).toHaveCSS("background-image", /chips-cavolo-nero-terracotta\.jpg/);

  const response = await thumbnailResponse;
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("image/jpeg");
});

test("recipe page renders LaTeX formulas as katex, not raw markdown", async ({ page }) => {
  await page.goto("/recipes/polpo-sous-vide");

  const article = page.locator("article.markdown-content");
  await expect(article).not.toContainText("$$");

  const formula = article.locator(".katex").first();
  await expect(formula).toBeVisible();
  await expect(formula.locator(".katex-mathml")).toBeVisible();
});

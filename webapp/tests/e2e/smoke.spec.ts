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

  await page.goto("/", { waitUntil: "domcontentloaded" });
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

test("tag grouping presents square summary cards with counts on recipes and guides", async ({ page }) => {
  for (const path of ["/", "/guides"]) {
    await page.goto(path);
    await page.getByRole("button", { name: "Raggruppa per tag" }).click();

    const tagCards = page.locator(".tag-bucket-card");
    await expect(tagCards.first()).toBeVisible();
    expect(await tagCards.count()).toBeGreaterThan(1);

    const firstCard = tagCards.first();
    await expect(firstCard.locator(".tag-bucket-card__icon svg")).toBeVisible();
    await expect(firstCard.locator(".tag-bucket-card__name")).not.toHaveText("");
    await expect(firstCard.locator(".tag-bucket-card__count")).toContainText(/\d+\s+(elemento|elementi)/i);

    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(Math.abs((cardBox?.width ?? 0) - (cardBox?.height ?? 0))).toBeLessThanOrEqual(8);

    const bucketName = (await firstCard.locator(".tag-bucket-card__name").textContent())?.trim();
    if (!bucketName) {
      throw new Error("The tag group card is missing its label");
    }

    await firstCard.click();
    await expect(page.getByRole("button", { name: `Cancella filtro ${bucketName}` })).toBeVisible();
    await expect(page.locator(".result-view-toggle button.is-selected")).toHaveText("Elenco semplice");

    const filteredCards = page.locator(".recipe-card");
    expect(await filteredCards.count()).toBeGreaterThan(0);

    for (let index = 0; index < (await filteredCards.count()); index += 1) {
      await expect(filteredCards.nth(index).locator(".card-tags")).toContainText(bucketName);
    }

    await page.getByRole("button", { name: `Cancella filtro ${bucketName}` }).click();
    await expect(page.getByRole("button", { name: `Cancella filtro ${bucketName}` })).toHaveCount(0);
    await expect(page.locator(".recipe-card").first()).toBeVisible();
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

test("mobile drawer exposes the same navigation and closes cleanly", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Apri menu" });
  await expect(menuButton).toBeVisible();

  await menuButton.click();
  const drawer = page.locator(".mobile-drawer");
  await expect(page.locator(".mobile-nav")).toHaveClass(/is-hidden/);
  await expect(drawer.getByRole("link", { name: "FAQ" })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Istruzioni" })).toBeVisible();

  await page.getByRole("button", { name: "Chiudi il menu" }).click();
  await expect(page.locator(".mobile-nav")).not.toHaveClass(/is-hidden/);
  await expect(page.getByRole("button", { name: "Apri menu" })).toBeVisible();
});

test("footer exposes the editorial story and landing link works from the legal area", async ({ page }) => {
  await page.goto("/supporto");

  const footerLink = page.getByRole("link", { name: "Chi sono" }).first();
  await expect(footerLink).toBeVisible();

  await footerLink.click();
  await expect(page).toHaveURL(/\/supporto#chi-siamo$/);

  await expect(page.getByRole("heading", { level: 2, name: "Chi sono / Metodologia" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Come lavoro" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "I nostri criteri editoriali" })).toBeVisible();
});

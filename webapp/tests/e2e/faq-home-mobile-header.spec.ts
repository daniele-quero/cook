import { expect, test } from "@playwright/test";

test("FAQ page shows a styled quick index and bold question/answer cards", async ({ page }) => {
  await page.goto("/faq");

  await expect(page.getByRole("heading", { level: 1, name: "FAQ" })).toBeVisible();

  const index = page.locator(".faq-index");
  await expect(index).toBeVisible();

  const firstIndexLink = index.locator("a").first();
  const targetId = await firstIndexLink.getAttribute("href");
  if (!targetId) {
    throw new Error("The FAQ quick index link is missing its destination");
  }

  await firstIndexLink.click();
  await expect(page.locator(targetId)).toBeInViewport();

  const firstItem = page.locator(".faq-item").first();
  await expect(firstItem).toBeVisible();
  await expect(firstItem.locator(".faq-question")).toBeVisible();
  await expect(firstItem.locator(".faq-answer")).toBeVisible();

  const questionWeight = await firstItem
    .locator(".faq-question")
    .evaluate((element) => Number.parseInt(window.getComputedStyle(element).fontWeight, 10));
  expect(questionWeight).toBeGreaterThanOrEqual(700);
});

test("FAQ e istruzioni spiegano il salvataggio manuale della sessione chat", async ({ page }) => {
  await page.goto("/faq");

  const faqItem = page.locator(".faq-item", { hasText: "Quando appare il pulsante Database / Salva sessione?" });
  await expect(faqItem).toContainText("consenso alla chat");
  await expect(faqItem).toContainText("condivisione delle sessioni è attiva");

  const saveExplanation = page.locator(".faq-item", { hasText: "Cosa succede se salvo manualmente una sessione chat?" });
  await expect(saveExplanation).toContainText("ultimi 40 messaggi");
  await expect(saveExplanation).toContainText("può essere anche 0");
  await expect(saveExplanation).toContainText("puoi riprovare");
  await expect(saveExplanation).toContainText("salvataggio automatico alla chiusura");

  await page.goto("/istruzioni");

  const instructions = page.locator("article.legal-content");
  await expect(
    page.getByRole("heading", { level: 2, name: "Salvare manualmente la sessione chat" }),
  ).toBeVisible();
  await expect(instructions).toContainText("icona Database");
  await expect(instructions).toContainText("ultimi 40 messaggi");
  await expect(instructions).toContainText("numero può essere 0");
  await expect(instructions).toContainText("errore reale");
  await expect(instructions).toContainText("salvataggio automatico della sessione alla chiusura");
});

test("home page CTAs establish a clear primary/secondary hierarchy", async ({ page }) => {
  await page.goto("/");

  const primary = page.locator(".landing-primary");
  const secondary = page.locator(".landing-secondary");

  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();
  await expect(primary).toHaveAttribute("href", "/#esplora");
  await expect(secondary).toHaveAttribute("href", "/#cerca");

  const primaryBox = await primary.boundingBox();
  const secondaryBox = await secondary.boundingBox();
  expect(primaryBox).not.toBeNull();
  expect(secondaryBox).not.toBeNull();
  expect((primaryBox?.height ?? 0)).toBeGreaterThan(secondaryBox?.height ?? 0);

  const primaryBackground = await primary.evaluate((element) => window.getComputedStyle(element).backgroundColor);
  const secondaryBackground = await secondary.evaluate((element) => window.getComputedStyle(element).backgroundColor);
  expect(primaryBackground).not.toBe(secondaryBackground);
  expect(primaryBackground).not.toBe("rgba(0, 0, 0, 0)");
});

test("mobile header keeps its controls within the viewport without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");

  const header = page.locator(".site-header");
  await expect(header).toBeVisible();

  const scopeToggle = page.locator(".header-search-scope");
  await expect(scopeToggle).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Apri ricerca" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Apri menu" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const headerBox = await header.boundingBox();
  expect(headerBox).not.toBeNull();
  expect(headerBox?.width ?? 0).toBeLessThanOrEqual(360);
});

test("mobile bottom nav highlights the active section", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/guides");

  const guideLink = page.locator(".mobile-nav a", { hasText: "Guide" });
  await expect(guideLink).toHaveClass(/nav-active/);

  const activeBackground = await guideLink.evaluate((element) => window.getComputedStyle(element).backgroundColor);
  expect(activeBackground).not.toBe("rgba(0, 0, 0, 0)");
});

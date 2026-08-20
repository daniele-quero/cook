import { expect, test } from "@playwright/test";

test("recipe and guide Markdown ### headings remain visible semantic h3 elements", async ({ page }) => {
  for (const path of ["/recipes/uovo-sous-vide", "/guides/risotto-tecnica-mantecatura"]) {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);

    const heading = page.locator("article.markdown-content h3").first();
    await expect(heading).toBeVisible();
    expect(await heading.evaluate((element) => element.tagName)).toBe("H3");
    const headingSize = await heading.evaluate((element) => Number.parseFloat(window.getComputedStyle(element).fontSize));
    expect(headingSize).toBeGreaterThanOrEqual(20);
  }
});

test("interactive controls expose delayed tooltips on keyboard focus without blocking clicks", async ({ page }) => {
  await page.goto("/");

  const searchButton = page.locator(".desktop-rail").getByRole("button", { name: "Apri ricerca" });
  await searchButton.focus();
  await expect(page.locator(".tooltip-content.is-visible")).toContainText("ricerca", { timeout: 2500 });

  await searchButton.click();
  await expect(page.locator(".search-dialog")).toBeVisible();
});

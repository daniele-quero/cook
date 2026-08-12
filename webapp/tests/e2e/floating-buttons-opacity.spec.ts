import { expect, test, type Locator } from "@playwright/test";

declare global {
  interface Window {
    __scrollTimer?: ReturnType<typeof setInterval>;
  }
}

const recipeUrl = "/recipes/uovo-sous-vide";

async function getBottomPx(locator: Locator) {
  return locator.evaluate((element) => window.getComputedStyle(element).bottom);
}

async function startContinuousScrollEvents(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    window.__scrollTimer = window.setInterval(() => window.dispatchEvent(new Event("scroll")), 50);
  });
}

async function stopContinuousScrollEvents(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    if (window.__scrollTimer) window.clearInterval(window.__scrollTimer);
  });
}

test("floating chat and table triggers dim while scrolling and return to full opacity once idle", async ({ page }) => {
  await page.goto(recipeUrl);

  const chatTrigger = page.locator(".recipe-chat-trigger");
  const tableTrigger = page.locator(".recipe-table-trigger");

  await expect(chatTrigger).toBeVisible();
  await expect(tableTrigger).toBeVisible();
  await expect(chatTrigger).toHaveCSS("opacity", "1");
  await expect(tableTrigger).toHaveCSS("opacity", "1");

  await startContinuousScrollEvents(page);

  await expect(chatTrigger).toHaveCSS("opacity", "0.5");
  await expect(tableTrigger).toHaveCSS("opacity", "0.5");

  await stopContinuousScrollEvents(page);
  await page.waitForTimeout(500);

  await expect(chatTrigger).toHaveCSS("opacity", "1");
  await expect(tableTrigger).toHaveCSS("opacity", "1");
});

test("the table jump trigger stays clickable while dimmed during scroll", async ({ page }) => {
  await page.goto(recipeUrl);

  const tableTrigger = page.getByRole("button", { name: "Vai alla tabella successiva (7 tabelle)" });
  const firstTable = page.locator("article.markdown-content table").first();

  await expect(tableTrigger).toBeVisible();

  await startContinuousScrollEvents(page);
  await expect(tableTrigger).toHaveCSS("opacity", "0.5");
  await expect(tableTrigger).toBeEnabled();

  await tableTrigger.click();
  await stopContinuousScrollEvents(page);

  await expect.poll(async () => {
    const box = await firstTable.boundingBox();
    return box ? Math.abs(box.y) < 200 : false;
  }).toBe(true);
});

test("floating triggers sit at their original mobile offsets and are unchanged on desktop", async ({ page }) => {
  await page.goto(recipeUrl);

  const chatTrigger = page.locator(".recipe-chat-trigger");
  const tableTrigger = page.locator(".recipe-table-trigger");

  await expect(chatTrigger).toHaveCSS("bottom", "24px");
  await expect(tableTrigger).toHaveCSS("bottom", "84px");

  await page.setViewportSize({ width: 390, height: 844 });

  expect(await getBottomPx(chatTrigger)).toBe("74px");
  expect(await getBottomPx(tableTrigger)).toBe("132px");
});

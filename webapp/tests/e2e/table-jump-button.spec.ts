import { expect, test, type Locator } from "@playwright/test";

const tableSelector = "article.markdown-content table";

async function isScrolledToTable(table: Locator) {
  return table.evaluate((element) => {
    const target = element.closest<HTMLElement>(".table-scroll") ?? element;
    const scrollMarginTop = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - scrollMarginTop;
    const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const expectedScrollY = Math.min(Math.max(0, targetTop), Math.max(0, documentHeight - window.innerHeight));

    return Math.abs(window.scrollY - expectedScrollY) < 4;
  });
}

async function expectTableTriggerAboveChat(tableTrigger: Locator, chatTrigger: Locator) {
  const [tableBox, chatBox] = await Promise.all([tableTrigger.boundingBox(), chatTrigger.boundingBox()]);
  if (!tableBox || !chatBox) {
    throw new Error("The floating recipe triggers must be visible before checking their layout.");
  }

  expect(tableBox.y + tableBox.height).toBeLessThanOrEqual(chatBox.y);
}

test("the table jump button counts recipe tables and cycles through them in document order", async ({ page }) => {
  await page.goto("/recipes/uovo-sous-vide");

  const tables = page.locator(tableSelector);
  const tableJumpButton = page.getByRole("button", { name: "Vai alla tabella successiva (7 tabelle)" });

  await expect(page.getByTestId("sous-vide-egg-calculator")).toBeVisible();
  await expect(tables).toHaveCount(7);
  await expect(tableJumpButton).toBeVisible();
  await expect(tableJumpButton).toHaveText("7");

  for (let index = 0; index < 7; index += 1) {
    await tableJumpButton.click();
    await expect.poll(() => isScrolledToTable(tables.nth(index))).toBe(true);
  }

  await tableJumpButton.click();
  await expect.poll(() => isScrolledToTable(tables.first())).toBe(true);
});

test("the table jump button stays hidden when the recipe has no tables", async ({ page }) => {
  await page.addInitScript((selector) => {
    const nativeQuerySelectorAll = document.querySelectorAll.bind(document);
    document.querySelectorAll = ((query: string) => {
      if (query === selector) {
        return document.createDocumentFragment().querySelectorAll("table");
      }

      return nativeQuerySelectorAll(query);
    }) as typeof document.querySelectorAll;
  }, tableSelector);

  await page.goto("/recipes/uovo-sous-vide");

  await expect(page.getByRole("button", { name: /Vai alla tabella successiva/ })).toHaveCount(0);
});

test("the table jump button stays above the chat trigger on desktop and mobile", async ({ page }) => {
  await page.goto("/recipes/uovo-sous-vide");

  const tableTrigger = page.getByRole("button", { name: "Vai alla tabella successiva (7 tabelle)" });
  const chatTrigger = page.locator(".recipe-chat-trigger");

  await expect(tableTrigger).toBeVisible();
  await expect(chatTrigger).toBeVisible();
  await expectTableTriggerAboveChat(tableTrigger, chatTrigger);

  await page.setViewportSize({ width: 390, height: 844 });

  await expect(tableTrigger).toBeVisible();
  await expect(chatTrigger).toBeVisible();
  await expectTableTriggerAboveChat(tableTrigger, chatTrigger);
});

test("guide detail pages cycle through their tables and keep the trigger above chat", async ({ page }) => {
  await page.goto("/guides/risotto-tecnica-mantecatura");

  const tables = page.locator(tableSelector);
  const tableJumpButton = page.getByRole("button", { name: "Vai alla tabella successiva (3 tabelle)" });
  const chatTrigger = page.locator(".recipe-chat-trigger");

  await expect(tables).toHaveCount(3);
  await expect(tableJumpButton).toBeVisible();
  await expect(chatTrigger).toBeVisible();
  await expectTableTriggerAboveChat(tableJumpButton, chatTrigger);

  for (let index = 0; index < 3; index += 1) {
    await tableJumpButton.click();
    await expect.poll(() => isScrolledToTable(tables.nth(index))).toBe(true);
  }

  await tableJumpButton.click();
  await expect.poll(() => isScrolledToTable(tables.first())).toBe(true);
});

test("guide detail pages hide the table trigger when a guide has no tables", async ({ page }) => {
  await page.addInitScript((selector) => {
    const nativeQuerySelectorAll = document.querySelectorAll.bind(document);
    document.querySelectorAll = ((query: string) => {
      if (query === selector) {
        return document.createDocumentFragment().querySelectorAll("table");
      }

      return nativeQuerySelectorAll(query);
    }) as typeof document.querySelectorAll;
  }, tableSelector);

  await page.goto("/guides/cottura-passiva-pasta");

  await expect(page.getByRole("button", { name: /Vai alla tabella successiva/ })).toHaveCount(0);
});
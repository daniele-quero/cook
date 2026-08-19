import { expect, test } from "@playwright/test";

test("piadine ingredient tables rescale servings independently in both orientations", async ({ page }) => {
  await page.goto("/recipes/piadine-senza-glutine-water-roux");

  const tables = page.locator('.ingredient-table[data-scale-kind="yield"]');
  await expect(tables).toHaveCount(5);

  const vertical = page.locator('.ingredient-table[data-table-orientation="vertical"][data-scale-kind="yield"]').first();
  const horizontal = page.locator('.ingredient-table[data-table-orientation="horizontal"][data-scale-kind="yield"]').first();

  await expect(vertical.locator(".ingredient-table-status")).toContainText("Base: 140 g = 6 piadine");
  await expect(horizontal.locator(".ingredient-table-status")).toContainText("Base: 140 g = 6 piadine");

  await vertical.getByRole("button", { name: "Modifica numero di piadine" }).click();
  const verticalYield = vertical.getByRole("spinbutton", { name: "Numero di piadine da ottenere" });
  await expect(verticalYield).toHaveValue("6");
  await verticalYield.fill("12");
  await vertical.getByRole("button", { name: "Applica" }).click();

  await expect(vertical.locator(".ingredient-table-status")).toContainText("Attuale: 12 piadine");
  await expect(vertical.locator("tbody tr").first().locator("td").nth(1)).toHaveText("280 g");
  await vertical.getByRole("button", { name: "Modifica Farina di riso finissima" }).click();
  await expect(vertical.getByRole("spinbutton", { name: /Nuova quantità per Farina di riso finissima/ })).toHaveValue("280");
  await vertical.getByRole("button", { name: "Annulla" }).click();

  await expect(horizontal.locator(".ingredient-table-status")).toContainText("= 6 piadine");
  await horizontal.getByRole("button", { name: "Modifica numero di piadine" }).click();
  const horizontalYield = horizontal.getByRole("spinbutton", { name: "Numero di piadine da ottenere" });
  await horizontalYield.fill("0");
  await horizontal.getByRole("button", { name: "Applica" }).click();
  await expect(horizontal.getByRole("alert")).toHaveText("Inserisci un numero di piadine intero maggiore di zero.");

  await horizontalYield.fill("3");
  await horizontal.getByRole("button", { name: "Applica" }).click();
  await expect(horizontal.locator(".ingredient-table-status")).toContainText("Attuale: 3 piadine");
  await expect(horizontal.locator("tbody tr").first().locator("td").first()).toContainText("70 g riso finissimo");
  await expect(vertical.locator(".ingredient-table-status")).toContainText("Attuale: 12 piadine");
  await expect(vertical.locator("tbody tr").first().locator("td").nth(1)).toHaveText("280 g");
});

test("instructions document ingredient rescaling and sous-vide egg profile recalculation", async ({ page }) => {
  await page.goto("/istruzioni");

  await expect(page.getByRole("heading", { level: 2, name: "Rescale delle tabelle ingredienti" })).toBeVisible();
  const instructionsContent = page.locator(".legal-content");
  await expect(instructionsContent).toContainText("140 g di farina per 6 piadine");
  await expect(instructionsContent).toContainText("profili di cottura delle uova sous-vide");
});

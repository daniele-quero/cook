import { expect, test } from "@playwright/test";

const profileSafetyWarning = "In questo profilo il tuorlo NON è pastorizzato, indipendentemente dal peso o dalla temperatura di partenza inseriti.";
const riskNotice = "Soggetti a rischio (immunocompromessi, anziani, bambini, gravidanza): solo il profilo 1; i profili 2-5 solo con uova pastorizzate prima (57 °C × 75 min), indipendentemente dai parametri inseriti.";

test("the sous-vide egg recipe recalculates profiles and preserves safety constraints", async ({ page }) => {
  await page.goto("/recipes/uovo-sous-vide");

  const calculator = page.getByTestId("sous-vide-egg-calculator");
  const weight = page.getByTestId("egg-weight");
  const initialTemperature = page.getByTestId("egg-initial-temperature");
  const profileOneTime = page.getByTestId("egg-profile-time-1");
  const favouriteTime = page.getByTestId("egg-profile-time-4");
  const state = page.getByTestId("egg-calculator-state");

  await expect(calculator).toBeVisible();
  await expect(calculator.locator("td[data-time-source]")).toHaveCount(5);
  await expect(weight).toHaveValue("60");
  await expect(initialTemperature).toHaveValue("3");
  await expect(calculator).toContainText("Il bagno è sempre già preriscaldato alla temperatura target");
  await expect(calculator).toContainText("riferiti a un uovo intero da 60 g con temperatura iniziale di 5 °C e sono espressi in minuti:secondi");
  await expect(calculator).toContainText(riskNotice);

  await expect(state).toContainText("Tempi ricalcolati per 60 g e 3 °C.");
  await expect(favouriteTime).toHaveAttribute("data-time-source", "recalculated");
  await expect(favouriteTime).toHaveText("7:34–7:44");

  await initialTemperature.fill("5");
  await expect(state).toContainText("Tempi ricalcolati per 60 g e 5 °C.");
  await expect(favouriteTime).toHaveText("7:25–7:35");
  await expect(profileOneTime).toHaveText("30:00–32:00");

  await weight.fill("70");
  await expect(state).toContainText("Tempi ricalcolati per 70 g e 5 °C.");
  await expect(favouriteTime).toHaveText("8:07–8:17");

  await initialTemperature.fill("9");
  await expect(state).toContainText("Il calcolo è bloccato: la temperatura iniziale deve restare fra 0 e 8 °C.");
  await expect(profileOneTime).toHaveAttribute("data-time-source", "standard");
  await expect(profileOneTime).toHaveText("30:00–32:00");
  await expect(favouriteTime).toHaveText("7:25–7:35");

  await initialTemperature.fill("4");
  await weight.fill("80");
  await expect(state).toContainText("Il calcolo è bloccato: il peso deve essere compreso tra 45 e 75 g.");
  await expect(profileOneTime).toHaveAttribute("data-time-source", "standard");
  await expect(profileOneTime).toHaveText("30:00–32:00");

  await weight.fill("47");
  await expect(state).toContainText("stima estrapolata, fuori dal set di calibrazione");
  await expect(profileOneTime).toHaveAttribute("data-time-source", "recalculated");
  await expect(profileOneTime).not.toHaveText("30:00–32:00");

  await expect(page.getByTestId("egg-profile-safety-1")).toHaveCount(0);
  for (const id of ["2", "3", "4", "5"]) {
    const warning = page.getByTestId(`egg-profile-safety-${id}`);
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(profileSafetyWarning);
  }
});

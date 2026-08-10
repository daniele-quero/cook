import { expect, test } from "@playwright/test";

test("the sous-vide egg recipe recalculates profiles and preserves safety constraints", async ({ page }) => {
  await page.goto("/recipes/uovo-sous-vide");

  const calculator = page.getByTestId("sous-vide-egg-calculator");
  const weight = page.getByTestId("egg-weight");
  const initialTemperature = page.getByTestId("egg-initial-temperature");
  const profileOneTime = page.getByTestId("egg-profile-time-1");
  const state = page.getByTestId("egg-calculator-state");

  await expect(calculator).toBeVisible();
  await expect(weight).toHaveValue("60");
  await expect(initialTemperature).toHaveValue("3");
  await expect(profileOneTime).toHaveAttribute("data-time-source", "recalculated");
  await expect(calculator).toContainText("Il bagno è sempre già preriscaldato alla temperatura target");
  await expect(calculator).toContainText("Soggetti a rischio (immunocompromessi, anziani, bambini, gravidanza): solo profili 1-5");

  const defaultTime = await profileOneTime.textContent();
  if (!defaultTime) {
    throw new Error("The first egg profile time is missing.");
  }

  await initialTemperature.fill("8");
  await expect(profileOneTime).not.toHaveText(defaultTime);

  const warmedEggTime = await profileOneTime.textContent();
  if (!warmedEggTime) {
    throw new Error("The warmed egg profile time is missing.");
  }

  await weight.fill("70");
  await expect(profileOneTime).not.toHaveText(warmedEggTime);
  await expect(state).toContainText("Tempi ricalcolati per 70 g e 8 °C.");

  await initialTemperature.fill("9");
  await expect(state).toContainText("Il calcolo è bloccato: la temperatura iniziale deve restare fra 0 e 8 °C.");
  await expect(profileOneTime).toHaveAttribute("data-time-source", "standard");
  await expect(profileOneTime).toHaveText("45–50 min");

  await initialTemperature.fill("4");
  await weight.fill("80");
  await expect(state).toContainText("Il calcolo è bloccato: il peso deve essere compreso tra 45 e 75 g.");
  await expect(profileOneTime).toHaveAttribute("data-time-source", "standard");

  await weight.fill("47");
  await expect(state).toContainText("stima estrapolata, fuori dal set di calibrazione");
  await expect(profileOneTime).toHaveAttribute("data-time-source", "recalculated");

  await expect(page.getByTestId("egg-profile-safety-6")).toBeVisible();
  await expect(page.getByTestId("egg-profile-safety-7")).toBeVisible();
  await expect(page.getByTestId("egg-profile-safety-6")).toContainText("indipendentemente dal peso o dalla temperatura di partenza inseriti");
  await expect(page.getByTestId("egg-profile-safety-7")).toContainText("indipendentemente dal peso o dalla temperatura di partenza inseriti");
});
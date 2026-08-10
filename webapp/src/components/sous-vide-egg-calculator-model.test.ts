import { describe, expect, it } from "vitest";
import { splitRecipeContent } from "@/lib/ingredient-tables";
import { getRecipe } from "@/lib/recipes";
import {
  R_REF_M,
  calibratedRadiusFromWeight,
  eggProfilesFromTable,
  recalculateProfileTimeRange,
} from "./sous-vide-egg-calculator-model";

function profilesFromRecipe() {
  const recipe = getRecipe("uovo-sous-vide");
  if (!recipe) {
    throw new Error("The uovo-sous-vide recipe is unavailable.");
  }

  const part = splitRecipeContent(recipe.content).find((contentPart) => contentPart.type === "recalc-table");
  if (!part || part.type !== "recalc-table") {
    throw new Error("The uovo-sous-vide recipe is missing its recalculation table.");
  }

  return eggProfilesFromTable(part.table);
}

describe("sous vide egg calculator model", () => {
  it("normalizes the 60 g reference egg to the calibrated radius", () => {
    expect(calibratedRadiusFromWeight(60)).toBeCloseTo(R_REF_M, 12);
  });

  it("reproduces all seven table reference times at 60 g and 4 C", () => {
    const profiles = profilesFromRecipe();

    expect(profiles).toHaveLength(7);
    for (const profile of profiles) {
      const recalculated = recalculateProfileTimeRange(profile, 60, 4);
      expect(recalculated.lower).toBeCloseTo(profile.referenceTime.lower, 8);
      expect(recalculated.upper).toBeCloseTo(profile.referenceTime.upper, 8);
    }
  });
});
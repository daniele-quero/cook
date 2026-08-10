import { describe, expect, it } from "vitest";
import { splitRecipeContent } from "@/lib/ingredient-tables";
import { getRecipe } from "@/lib/recipes";
import {
  R_REF_M,
  calibratedRadiusFromWeight,
  ceilTimeRange,
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

  it("rounds displayed reference times up without floating-point artifacts", () => {
    const roundedProfiles = profilesFromRecipe().map((profile) => (
      ceilTimeRange(recalculateProfileTimeRange(profile, 60, 4))
    ));

    expect(roundedProfiles).toEqual([
      { lower: 45, upper: 50 },
      { lower: 30, upper: 35 },
      { lower: 20, upper: 23 },
      { lower: 13, upper: 15 },
      { lower: 11, upper: 12 },
      { lower: 7, upper: 8 },
      { lower: 6, upper: 7 },
    ]);
    expect(ceilTimeRange({ lower: 20.0001, upper: 23.0001 })).toEqual({ lower: 21, upper: 24 });
  });
});
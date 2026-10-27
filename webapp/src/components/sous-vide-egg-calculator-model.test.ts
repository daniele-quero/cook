import { describe, expect, it } from "vitest";
import { splitRecipeContent, type RecipeTable } from "@/lib/ingredient-tables";
import { getRecipe } from "@/lib/recipes";
import {
  formatTimeRange,
  parseEggProfileTable,
  recalculateProfileTimeRange,
  type EggProfileTableRow,
  type SousVideEggProfile,
} from "./sous-vide-egg-calculator-model";

const expectedWindows: Array<[weightGrams: number, initialTemperatureC: number, windows: string[]]> = [
  [60, 3, ["30:12–32:12", "11:45–12:15", "11:15–11:45", "7:34–7:44", "9:59–10:29"]],
  [55, 5, ["28:37–30:37", "10:56–11:26", "10:28–10:58", "7:03–7:13", "9:17–9:47"]],
  [65, 5, ["31:20–33:20", "12:13–12:43", "11:41–12:11", "7:46–7:56", "10:22–10:52"]],
  [75, 0, ["34:25–36:25", "13:55–14:25", "13:19–13:49", "8:52–9:02", "11:50–12:20"]],
  [45, 8, ["25:24–27:24", "9:22–9:52", "8:57–9:27", "6:05–6:15", "7:56–8:26"]],
];

function recipeTable(): RecipeTable {
  const recipe = getRecipe("uovo-sous-vide");
  if (!recipe) {
    throw new Error("The uovo-sous-vide recipe is unavailable.");
  }

  const part = splitRecipeContent(recipe.content).find((contentPart) => contentPart.type === "recalc-table");
  if (!part || part.type !== "recalc-table") {
    throw new Error("The uovo-sous-vide recipe is missing its recalculation table.");
  }

  return part.table;
}

function columnOf(table: RecipeTable, pattern: RegExp) {
  return table.headers.findIndex((header) => pattern.test(header));
}

function rowWithId(rows: string[][], idColumn: number, id: string) {
  const row = rows.find((cells) => cells[idColumn] === id);
  if (!row) {
    throw new Error(`The recipe table has no profile ${id}.`);
  }
  return row;
}

function profileRow(rows: EggProfileTableRow[], id: string) {
  const row = rows.find((candidate) => candidate.id === id);
  if (!row) {
    throw new Error(`The parsed table has no profile ${id}.`);
  }
  return row;
}

function replaceCells(table: RecipeTable, id: string, cells: { temperature?: string; time?: string }): RecipeTable {
  const idColumn = columnOf(table, /^#$/);
  const temperatureColumn = columnOf(table, /temperatura/i);
  const timeColumn = columnOf(table, /tempo/i);

  return {
    headers: table.headers,
    rows: table.rows.map((row) => {
      if (row[idColumn] !== id) {
        return row;
      }

      const edited = [...row];
      if (cells.temperature !== undefined) {
        edited[temperatureColumn] = cells.temperature;
      }
      if (cells.time !== undefined) {
        edited[timeColumn] = cells.time;
      }
      return edited;
    }),
  };
}

function recipeProfiles(): SousVideEggProfile[] {
  const { rows, errors } = parseEggProfileTable(recipeTable());
  expect(errors).toEqual([]);

  return rows.map(({ id, profile }) => {
    if (!profile) {
      throw new Error(`Profile ${id} does not match the calculator model.`);
    }
    return profile;
  });
}

function windowsFor(weightGrams: number, initialTemperatureC: number) {
  return recipeProfiles().map((profile) => (
    formatTimeRange(recalculateProfileTimeRange(profile, weightGrams, initialTemperatureC))
  ));
}

describe("sous vide egg calculator model", () => {
  it("matches the recipe table to the five calibrated profiles without drift", () => {
    expect(recipeProfiles().map(({ id, bathTemperatureC }) => [id, bathTemperatureC])).toEqual([
      ["1", 68.5],
      ["2", 79],
      ["3", 83],
      ["4", 88.5],
      ["5", 90],
    ]);
  });

  it("reproduces the table windows for the 60 g reference egg at 5 °C", () => {
    const table = recipeTable();
    const timeColumn = columnOf(table, /tempo/i);

    expect(windowsFor(60, 5)).toEqual(table.rows.map((row) => row[timeColumn]));
    expect(windowsFor(60, 5)).toEqual(["30:00–32:00", "11:35–12:05", "11:05–11:35", "7:25–7:35", "9:50–10:20"]);
  });

  it.each(expectedWindows)("recalculates every profile window for a %d g egg at %d °C", (weightGrams, initialTemperatureC, windows) => {
    expect(windowsFor(weightGrams, initialTemperatureC)).toEqual(windows);
  });

  it("keeps every window width, 10 s for profile 4, across the whole 45-75 g / 0-8 °C domain", () => {
    const profiles = recipeProfiles();
    const favouriteWidths = new Set<number>();
    const widthChanges: string[] = [];

    for (let weightTenths = 450; weightTenths <= 750; weightTenths += 1) {
      for (let temperatureTenths = 0; temperatureTenths <= 80; temperatureTenths += 1) {
        for (const profile of profiles) {
          const { lower, upper } = recalculateProfileTimeRange(profile, weightTenths / 10, temperatureTenths / 10);
          if (profile.id === "4") {
            favouriteWidths.add(upper - lower);
          }
          if (upper - lower !== profile.referenceTime.upper - profile.referenceTime.lower) {
            widthChanges.push(`profile ${profile.id} at ${weightTenths / 10} g / ${temperatureTenths / 10} °C`);
          }
        }
      }
    }

    expect([...favouriteWidths]).toEqual([10]);
    expect(widthChanges).toEqual([]);
  });

  it("marks only profile 1 as pasteurizing the yolk", () => {
    expect(recipeProfiles().filter((profile) => profile.pasteurizesYolk).map((profile) => profile.id)).toEqual(["1"]);
  });

  it("formats second ranges as m:ss windows", () => {
    expect(formatTimeRange({ lower: 454, upper: 464 })).toBe("7:34–7:44");
    expect(formatTimeRange({ lower: 59, upper: 61 })).toBe("0:59–1:01");
  });

  it("accepts temperature ranges, bold markup and plain hyphens in the table", () => {
    const { rows, errors } = parseEggProfileTable(
      replaceCells(recipeTable(), "4", { temperature: "**88–89 °C**", time: "**7:25-7:35**" }),
    );

    expect(errors).toEqual([]);
    expect(profileRow(rows, "4").profile?.referenceTime).toEqual({ lower: 445, upper: 455 });
  });

  describe("drift protection", () => {
    it("rejects a bath temperature that no longer matches its profile", () => {
      const { rows, errors } = parseEggProfileTable(replaceCells(recipeTable(), "4", { temperature: "88 °C" }));

      expect(errors).toEqual(["Profilo 4: temperatura 88 °C diversa da quella prevista dal modello (88.5 °C)."]);
      expect(profileRow(rows, "4").profile).toBeUndefined();
      expect(profileRow(rows, "1").profile?.pasteurizesYolk).toBe(true);
    });

    it("rejects missing, unknown and duplicated profiles", () => {
      const table = recipeTable();
      const idColumn = columnOf(table, /^#$/);
      const unknownProfile = rowWithId(table.rows, idColumn, "5").map((cell, index) => (index === idColumn ? "6" : cell));
      const duplicatedProfile = rowWithId(table.rows, idColumn, "2");

      const { rows, errors } = parseEggProfileTable({
        headers: table.headers,
        rows: [...table.rows.filter((row) => row[idColumn] !== "5"), unknownProfile, duplicatedProfile],
      });

      expect(errors).toEqual([
        "Profilo 6: non previsto dal modello di calcolo.",
        "Profilo 2: duplicato nella tabella.",
        "Profilo 5: assente nella tabella.",
      ]);
      expect(rows.map(({ id, profile }) => [id, Boolean(profile)])).toEqual([
        ["1", true],
        ["2", true],
        ["3", true],
        ["4", true],
        ["6", false],
        ["2", false],
      ]);
    });

    it("rejects unreadable cells and missing columns", () => {
      expect(parseEggProfileTable(replaceCells(recipeTable(), "3", { temperature: "circa 83", time: "11 min" })).errors).toEqual([
        'Profilo 3: temperatura "circa 83" non leggibile.',
        'Profilo 3: tempo "11 min" non valido, atteso un intervallo m:ss–m:ss.',
      ]);
      expect(parseEggProfileTable(replaceCells(recipeTable(), "2", { time: "12:05–11:35" })).errors).toEqual([
        'Profilo 2: tempo "12:05–11:35" non valido, atteso un intervallo m:ss–m:ss.',
      ]);

      const table = recipeTable();
      const timeColumn = columnOf(table, /tempo/i);
      const withoutTime = parseEggProfileTable({
        headers: table.headers.filter((_, index) => index !== timeColumn),
        rows: table.rows.map((row) => row.filter((_, index) => index !== timeColumn)),
      });

      expect(withoutTime.errors).toEqual(['La tabella non contiene la colonna "Tempo".']);
      expect(withoutTime.rows.map(({ id, profile }) => [id, profile])).toEqual([
        ["1", undefined],
        ["2", undefined],
        ["3", undefined],
        ["4", undefined],
        ["5", undefined],
      ]);
    });
  });
});

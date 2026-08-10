import type { RecipeTable } from "@/lib/ingredient-tables";

export const ALPHA = 1.4e-7;
export const RHO = 1.035;
export const R_REF_M = 0.0243;
export const T_INIT_REF = 4;

const REFERENCE_WEIGHT_GRAMS = 60;

export type TimeRange = {
  lower: number;
  upper: number;
};

export type SousVideEggProfile = {
  id: string;
  referenceTime: TimeRange;
  bathTemperature: TimeRange;
  targetCenterTemperature: TimeRange;
};

export function radiusFromWeight(weightGrams: number): number {
  const volumeCm3 = weightGrams / RHO;
  const radiusCm = Math.cbrt((3 * volumeCm3) / (4 * Math.PI));
  return radiusCm / 100;
}

export function calibratedRadiusFromWeight(weightGrams: number): number {
  return radiusFromWeight(weightGrams) * (R_REF_M / radiusFromWeight(REFERENCE_WEIGHT_GRAMS));
}

export function thetaCenter(fo: number, terms = 6): number {
  let sum = 0;
  for (let index = 1; index <= terms; index += 1) {
    const sign = index % 2 === 1 ? 1 : -1;
    sum += sign * Math.exp(-index * index * Math.PI * Math.PI * fo);
  }
  return 2 * sum;
}

export function solveFourierForTheta(thetaTarget: number): number {
  let lo = 1e-6;
  let hi = 5;
  for (let index = 0; index < 60; index += 1) {
    const mid = (lo + hi) / 2;
    if (thetaCenter(mid) > thetaTarget) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

export function calibrateTargetCenterTemp(tBathC: number, tRefMin: number): number {
  const tauRefSec = (R_REF_M ** 2) / ALPHA;
  const foRef = (tRefMin * 60) / tauRefSec;
  const thetaRef = thetaCenter(foRef);
  return tBathC + thetaRef * (T_INIT_REF - tBathC);
}

export function recalcTimeMinutes(
  tBathC: number,
  targetCenterTemp: number,
  weightGrams: number,
  initTempC: number,
): number {
  const radius = calibratedRadiusFromWeight(weightGrams);
  const tauSec = (radius ** 2) / ALPHA;
  const thetaTarget = (targetCenterTemp - tBathC) / (initTempC - tBathC);
  const fo = solveFourierForTheta(thetaTarget);
  return (fo * tauSec) / 60;
}

function numberRange(value: string): TimeRange {
  const values = (value.replaceAll(",", ".").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (!values.length || values.some((number) => !Number.isFinite(number))) {
    throw new Error(`Unable to parse the numeric range: ${value}`);
  }

  return {
    lower: values[0],
    upper: values[1] ?? values[0],
  };
}

function requiredColumn(table: RecipeTable, pattern: RegExp, label: string): number {
  const column = table.headers.findIndex((header) => pattern.test(header));
  if (column === -1) {
    throw new Error(`The egg profile table is missing its ${label} column.`);
  }
  return column;
}

export function eggProfilesFromTable(table: RecipeTable): SousVideEggProfile[] {
  const idColumn = requiredColumn(table, /^#$/, "identifier");
  const temperatureColumn = requiredColumn(table, /temperatura/i, "temperature");
  const timeColumn = requiredColumn(table, /tempo/i, "time");

  return table.rows.map((row) => {
    const id = row[idColumn];
    const bathTemperature = numberRange(row[temperatureColumn] ?? "");
    const referenceTime = numberRange(row[timeColumn] ?? "");

    return {
      id,
      bathTemperature,
      referenceTime,
      targetCenterTemperature: {
        lower: calibrateTargetCenterTemp(bathTemperature.lower, referenceTime.lower),
        upper: calibrateTargetCenterTemp(bathTemperature.upper, referenceTime.upper),
      },
    };
  });
}

export function recalculateProfileTimeRange(
  profile: SousVideEggProfile,
  weightGrams: number,
  initTempC: number,
): TimeRange {
  return {
    lower: recalcTimeMinutes(
      profile.bathTemperature.lower,
      profile.targetCenterTemperature.lower,
      weightGrams,
      initTempC,
    ),
    upper: recalcTimeMinutes(
      profile.bathTemperature.upper,
      profile.targetCenterTemperature.upper,
      weightGrams,
      initTempC,
    ),
  };
}
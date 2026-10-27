import type { RecipeTable } from "@/lib/ingredient-tables";

export const REFERENCE_WEIGHT_G = 60;
export const REFERENCE_INITIAL_TEMPERATURE_C = 5;

export type SecondsRange = {
  lower: number;
  upper: number;
};

type ProfileModel = {
  bathTemperatureC: number;
  weightExponent: number;
  temperatureCoefficient: number;
  pasteurizesYolk: boolean;
};

export type SousVideEggProfile = ProfileModel & {
  id: string;
  referenceTime: SecondsRange;
};

export type EggProfileTableRow = {
  id: string;
  profile?: SousVideEggProfile;
};

export type EggProfileTable = {
  rows: EggProfileTableRow[];
  errors: string[];
};

// Coefficients fitted on the two-layer yolk/white heat model (scripts/egg-model/sous-vide-egg-model.mjs).
// They are valid only for the listed bath temperature, which guards against recipe table drift.
const PROFILE_MODELS = new Map<string, ProfileModel>([
  ["1", { bathTemperatureC: 68.5, weightExponent: 0.525, temperatureCoefficient: 0.0032, pasteurizesYolk: true }],
  ["2", { bathTemperatureC: 79, weightExponent: 0.649, temperatureCoefficient: 0.0071, pasteurizesYolk: false }],
  ["3", { bathTemperatureC: 83, weightExponent: 0.649, temperatureCoefficient: 0.0071, pasteurizesYolk: false }],
  ["4", { bathTemperatureC: 88.5, weightExponent: 0.579, temperatureCoefficient: 0.0096, pasteurizesYolk: false }],
  ["5", { bathTemperatureC: 90, weightExponent: 0.649, temperatureCoefficient: 0.0073, pasteurizesYolk: false }],
]);

const TEMPERATURE_TOLERANCE_C = 1e-6;
const temperaturePattern = /^(\d+(?:[.,]\d+)?)(?:\s*[-–—]\s*(\d+(?:[.,]\d+)?))?\s*°?\s*C$/i;
const timeWindowPattern = /^(\d+):([0-5]\d)\s*[-–—]\s*(\d+):([0-5]\d)$/;

function plainCell(cell: string) {
  return cell.replaceAll("*", "").trim();
}

function decimal(value: string) {
  return Number(value.replace(",", "."));
}

function parseTemperature(cell: string) {
  const match = plainCell(cell).match(temperaturePattern);
  if (!match) {
    return undefined;
  }

  const lower = decimal(match[1]);
  const upper = match[2] === undefined ? lower : decimal(match[2]);
  return lower <= upper ? { lower, upper } : undefined;
}

function parseTimeWindow(cell: string): SecondsRange | undefined {
  const match = plainCell(cell).match(timeWindowPattern);
  if (!match) {
    return undefined;
  }

  const lower = Number(match[1]) * 60 + Number(match[2]);
  const upper = Number(match[3]) * 60 + Number(match[4]);
  return lower <= upper ? { lower, upper } : undefined;
}

function profileFromRow(
  id: string,
  temperatureCell: string,
  timeCell: string,
  errors: string[],
): SousVideEggProfile | undefined {
  const model = PROFILE_MODELS.get(id);
  if (!model) {
    errors.push(`Profilo ${id || "senza numero"}: non previsto dal modello di calcolo.`);
    return undefined;
  }

  const rowErrors: string[] = [];
  const temperature = parseTemperature(temperatureCell);
  if (!temperature) {
    rowErrors.push(`Profilo ${id}: temperatura "${plainCell(temperatureCell)}" non leggibile.`);
  } else if (
    model.bathTemperatureC < temperature.lower - TEMPERATURE_TOLERANCE_C
    || model.bathTemperatureC > temperature.upper + TEMPERATURE_TOLERANCE_C
  ) {
    rowErrors.push(
      `Profilo ${id}: temperatura ${plainCell(temperatureCell)} diversa da quella prevista dal modello (${model.bathTemperatureC} °C).`,
    );
  }

  const referenceTime = parseTimeWindow(timeCell);
  if (!referenceTime) {
    rowErrors.push(`Profilo ${id}: tempo "${plainCell(timeCell)}" non valido, atteso un intervallo m:ss–m:ss.`);
  }

  errors.push(...rowErrors);
  return referenceTime && rowErrors.length === 0 ? { id, ...model, referenceTime } : undefined;
}

function columnIndex(table: RecipeTable, pattern: RegExp) {
  return table.headers.findIndex((header) => pattern.test(header));
}

// Rows stay aligned with the table; a row gets a profile only when it matches the model,
// and the table is usable for recalculation only when errors is empty.
export function parseEggProfileTable(table: RecipeTable): EggProfileTable {
  const idColumn = columnIndex(table, /^#$/);
  const temperatureColumn = columnIndex(table, /temperatura/i);
  const timeColumn = columnIndex(table, /tempo/i);
  const missingColumns = [
    { label: "#", index: idColumn },
    { label: "Temperatura", index: temperatureColumn },
    { label: "Tempo", index: timeColumn },
  ].filter((column) => column.index === -1);

  if (missingColumns.length > 0) {
    return {
      rows: table.rows.map((row) => ({ id: idColumn === -1 ? "" : row[idColumn] ?? "" })),
      errors: missingColumns.map((column) => `La tabella non contiene la colonna "${column.label}".`),
    };
  }

  const errors: string[] = [];
  const seenIds = new Set<string>();
  const rows = table.rows.map((row): EggProfileTableRow => {
    const id = row[idColumn] ?? "";
    if (seenIds.has(id)) {
      errors.push(`Profilo ${id}: duplicato nella tabella.`);
      return { id };
    }

    seenIds.add(id);
    return { id, profile: profileFromRow(id, row[temperatureColumn] ?? "", row[timeColumn] ?? "", errors) };
  });

  for (const id of PROFILE_MODELS.keys()) {
    if (!seenIds.has(id)) {
      errors.push(`Profilo ${id}: assente nella tabella.`);
    }
  }

  return { rows, errors };
}

// Shifts the window centre by (m / 60)^p * exp(q * (5 - T0)) and keeps its width.
export function recalculateProfileTimeRange(
  profile: SousVideEggProfile,
  weightGrams: number,
  initialTemperatureC: number,
): SecondsRange {
  const factor = (weightGrams / REFERENCE_WEIGHT_G) ** profile.weightExponent
    * Math.exp(profile.temperatureCoefficient * (REFERENCE_INITIAL_TEMPERATURE_C - initialTemperatureC));
  const center = (profile.referenceTime.lower + profile.referenceTime.upper) / 2;
  const halfWidth = (profile.referenceTime.upper - profile.referenceTime.lower) / 2;

  return {
    lower: Math.round(center * factor - halfWidth),
    upper: Math.round(center * factor + halfWidth),
  };
}

function formatSeconds(totalSeconds: number) {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

export function formatTimeRange(range: SecondsRange) {
  return `${formatSeconds(range.lower)}–${formatSeconds(range.upper)}`;
}

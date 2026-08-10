export type RecipeTable = {
  headers: string[];
  rows: string[][];
};

export type IngredientTable = RecipeTable & {
  mainColumn: number;
  quantityColumn: number;
  orientation: "vertical" | "horizontal";
};

export type RecalcTableVariant = "sous-vide-egg-profiles";

export type RecipeContentPart =
  | { type: "markdown"; content: string }
  | { type: "ingredient-table"; table: IngredientTable }
  | { type: "recalc-table"; variant: RecalcTableVariant; table: RecipeTable };

const mainIngredientPattern = /<main>(.*?)<\/main>/i;
const recalcTableMarkerPattern = /^<!--\s*recalc-table:\s*(sous-vide-egg-profiles)\s*-->$/i;

function tableCells(line: string) {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isDividerRow(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function recipeTableFromLines(lines: string[]): RecipeTable | undefined {
  if (lines.length < 3 || !isDividerRow(lines[1])) {
    return undefined;
  }

  const headers = tableCells(lines[0]);
  const rows = lines.slice(2).map(tableCells);

  return { headers, rows };
}

function ingredientTableFromTable(table: RecipeTable): IngredientTable | undefined {
  const { headers, rows } = table;
  const mainColumn = headers.findIndex((header) => mainIngredientPattern.test(header));
  const mainRow = rows.findIndex((row) => row.some((cell) => mainIngredientPattern.test(cell)));

  if (mainColumn === -1 && mainRow === -1) {
    return undefined;
  }

  const orientation = mainColumn >= 0 ? "horizontal" : "vertical";
  const quantityColumn = orientation === "vertical"
    ? headers.findIndex((header) => /quantità|dose|porzion/i.test(header))
    : -1;

  if (orientation === "vertical" && quantityColumn === -1) {
    return undefined;
  }

  return {
    headers,
    rows,
    mainColumn: orientation === "horizontal" ? mainColumn : 0,
    quantityColumn,
    orientation,
  };
}

function recalcTableBefore(lines: string[], tableStart: number) {
  let markerIndex = tableStart - 1;
  while (markerIndex >= 0 && !lines[markerIndex].trim()) {
    markerIndex -= 1;
  }

  const match = lines[markerIndex]?.trim().match(recalcTableMarkerPattern);
  if (!match) {
    return undefined;
  }

  return {
    markerIndex,
    variant: match[1].toLowerCase() as RecalcTableVariant,
  };
}

export function ingredientName(value: string) {
  return value.replace(mainIngredientPattern, "$1").replace(/\*\*/g, "").trim();
}

export function splitRecipeContent(content: string): RecipeContentPart[] {
  const lines = content.split("\n");
  const parts: RecipeContentPart[] = [];
  let markdownStart = 0;

  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].trim().startsWith("|")) {
      continue;
    }

    const tableStart = index;
    while (index + 1 < lines.length && lines[index + 1].trim().startsWith("|")) {
      index += 1;
    }

    const recipeTable = recipeTableFromLines(lines.slice(tableStart, index + 1));
    if (!recipeTable) {
      continue;
    }

    const recalcTable = recalcTableBefore(lines, tableStart);
    const ingredientTable = recalcTable ? undefined : ingredientTableFromTable(recipeTable);
    if (!recalcTable && !ingredientTable) {
      continue;
    }

    const markdownEnd = recalcTable?.markerIndex ?? tableStart;
    const markdown = lines.slice(markdownStart, markdownEnd).join("\n").trim();
    if (markdown) {
      parts.push({ type: "markdown", content: markdown });
    }
    if (recalcTable) {
      parts.push({ type: "recalc-table", variant: recalcTable.variant, table: recipeTable });
    }
    if (ingredientTable) {
      parts.push({ type: "ingredient-table", table: ingredientTable });
    }
    markdownStart = index + 1;
  }

  const markdown = lines.slice(markdownStart).join("\n").trim();
  if (markdown) {
    parts.push({ type: "markdown", content: markdown });
  }

  return parts;
}
export type IngredientTable = {
  headers: string[];
  rows: string[][];
  mainColumn: number;
  quantityColumn: number;
  orientation: "vertical" | "horizontal";
};

export type RecipeContentPart =
  | { type: "markdown"; content: string }
  | { type: "ingredient-table"; table: IngredientTable };

const mainIngredientPattern = /<main>(.*?)<\/main>/i;

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

function tableFromLines(lines: string[]): IngredientTable | undefined {
  if (lines.length < 3 || !isDividerRow(lines[1])) {
    return undefined;
  }

  const headers = tableCells(lines[0]);
  const rows = lines.slice(2).map(tableCells);
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

    const table = tableFromLines(lines.slice(tableStart, index + 1));
    if (!table) {
      continue;
    }

    const markdown = lines.slice(markdownStart, tableStart).join("\n").trim();
    if (markdown) {
      parts.push({ type: "markdown", content: markdown });
    }
    parts.push({ type: "ingredient-table", table });
    markdownStart = index + 1;
  }

  const markdown = lines.slice(markdownStart).join("\n").trim();
  if (markdown) {
    parts.push({ type: "markdown", content: markdown });
  }

  return parts;
}
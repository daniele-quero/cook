import { describe, expect, it } from "vitest";
import { splitRecipeContent } from "./ingredient-tables";

describe("splitRecipeContent", () => {
  it("extracts a marked recalculation table without rendering its marker", () => {
    const parts = splitRecipeContent([
      "Introduzione",
      "",
      "<!-- recalc-table: sous-vide-egg-profiles -->",
      "",
      "| # | Temperatura | Tempo |",
      "|---|---:|---:|",
      "| 1 | 62-65 C | 45-50 min |",
      "",
      "Conclusione",
    ].join("\n"));

    expect(parts).toHaveLength(3);
    expect(parts[0]).toEqual({ type: "markdown", content: "Introduzione" });
    expect(parts[1]).toMatchObject({
      type: "recalc-table",
      variant: "sous-vide-egg-profiles",
      table: {
        headers: ["#", "Temperatura", "Tempo"],
        rows: [["1", "62-65 C", "45-50 min"]],
      },
    });
    expect(parts[2]).toEqual({ type: "markdown", content: "Conclusione" });
  });

  it("keeps unmarked markdown tables in markdown content", () => {
    const content = [
      "| Voce | Valore |",
      "|---|---:|",
      "| A | 1 |",
    ].join("\n");

    expect(splitRecipeContent(content)).toEqual([{ type: "markdown", content }]);
  });

  it("continues to extract ingredient tables", () => {
    const parts = splitRecipeContent([
      "| Ingrediente | Quantità |",
      "|---|---:|",
      "| <main>Uovo</main> | 2 |",
    ].join("\n"));

    expect(parts[0]).toMatchObject({
      type: "ingredient-table",
      table: {
        headers: ["Ingrediente", "Quantità"],
        rows: [["<main>Uovo</main>", "2"]],
      },
    });
  });

  it("classifies ingredient tables with a marked header as horizontal", () => {
    const parts = splitRecipeContent([
      "| <main>Farina</main> | Acqua |",
      "|---:|---:|",
      "| 140 g riso | 200 g |",
    ].join("\n"));

    expect(parts[0]).toMatchObject({
      type: "ingredient-table",
      table: {
        orientation: "horizontal",
        mainColumn: 0,
        rows: [["140 g riso", "200 g"]],
      },
    });
  });
});
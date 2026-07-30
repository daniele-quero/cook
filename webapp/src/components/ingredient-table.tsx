"use client";

import { FormEvent, useState } from "react";
import type { IngredientTable } from "@/lib/ingredient-tables";
import { ingredientName } from "@/lib/ingredient-tables";

type ParsedAmount = {
  first: number;
  second?: number;
  unit: string;
  suffix: string;
};

const amountPattern = /^\s*(\d+(?:[,.]\d+)?)(?:\s*[–-]\s*(\d+(?:[,.]\d+)?))?\s*(?:(\S+)(.*?))?\s*$/;
const scalableUnits = /^(g|kg|mg|ml|l|cl|pezzo|pezzi|spicchio|spicchi|foglia|foglie|rametto|rametti|cucchiaino|cucchiaini|cucchiaio|cucchiai)$/i;

function parseAmount(value: string): ParsedAmount | undefined {
  const match = value.replace(/\*\*/g, "").match(amountPattern);
  if (!match) {
    return undefined;
  }

  const first = Number(match[1].replace(",", "."));
  const second = match[2] ? Number(match[2].replace(",", ".")) : undefined;
  const unit = match[3]?.trim() ?? "";
  const suffix = match[4]?.trim() ?? "";
  if (
    !Number.isFinite(first)
    || (second !== undefined && !Number.isFinite(second))
    || (unit && !scalableUnits.test(unit))
  ) {
    return undefined;
  }

  return { first, second, unit, suffix };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: value < 10 ? 2 : 1 }).format(value);
}

function scaledAmount(value: string, factor: number) {
  const amount = parseAmount(value);
  if (!amount) {
    return undefined;
  }

  const range = amount.second === undefined
    ? formatNumber(amount.first * factor)
    : `${formatNumber(amount.first * factor)}-${formatNumber(amount.second * factor)}`;
  return `${range}${amount.unit ? ` ${amount.unit}` : ""}${amount.suffix ? ` ${amount.suffix}` : ""}`;
}

function preferredHorizontalRow(table: IngredientTable) {
  const emphasized = table.rows.find((row) => /\*\*\d/.test(row[table.mainColumn] ?? ""));
  return emphasized ?? table.rows[0];
}

function tableMainAmount(table: IngredientTable) {
  if (table.orientation === "vertical") {
    const row = table.rows.find((candidate) => candidate.some((cell) => /<main>/i.test(cell)));
    return row ? parseAmount(row[table.quantityColumn]) : undefined;
  }

  return parseAmount(preferredHorizontalRow(table)[table.mainColumn]);
}

function isScalableCell(table: IngredientTable, rowIndex: number, columnIndex: number) {
  if (table.orientation === "vertical") {
    return columnIndex === table.quantityColumn;
  }

  return rowIndex >= 0 && columnIndex >= 0;
}

export function IngredientTableView({ table }: { table: IngredientTable }) {
  const mainAmount = tableMainAmount(table);
  const [isEditing, setIsEditing] = useState(false);
  const [target, setTarget] = useState(mainAmount ? String(mainAmount.first).replace(".", ",") : "");
  const [factor, setFactor] = useState(1);
  const [error, setError] = useState<string>();
  const mainLabel = ingredientName(
    table.orientation === "vertical"
      ? table.rows.find((row) => row.some((cell) => /<main>/i.test(cell)))?.[0] ?? "Ingrediente principale"
      : table.headers[table.mainColumn],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedTarget = Number(target.replace(",", "."));
    if (!mainAmount || !Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setError("Inserisci una quantità maggiore di zero.");
      return;
    }

    setFactor(parsedTarget / mainAmount.first);
    setError(undefined);
    setIsEditing(false);
  }

  function renderCell(value: string, rowIndex: number, columnIndex: number) {
    const isMain = /<main>/i.test(value);
    const scalable = isScalableCell(table, rowIndex, columnIndex);
    const baseAmount = scalable ? parseAmount(value) : undefined;
    const display = baseAmount ? scaledAmount(value, factor) ?? ingredientName(value) : ingredientName(value);
    const ratio = baseAmount && mainAmount ? baseAmount.first / mainAmount.first : undefined;

    return (
      <td
        key={`${rowIndex}-${columnIndex}`}
        data-base-quantity={baseAmount?.first}
        data-ratio={ratio}
        data-scalable={baseAmount ? "true" : scalable ? "false" : undefined}
      >
        {isMain ? (
          <button
            className="main-ingredient-button"
            type="button"
            disabled={!mainAmount}
            onClick={() => setIsEditing(true)}
            title={mainAmount ? "Modifica la quantità e scala la tabella" : "Quantità principale non scalabile"}
          >
            {ingredientName(value)}
          </button>
        ) : display}
        {scalable && !baseAmount && <span className="unscaled-note">Quantità invariata</span>}
      </td>
    );
  }

  return (
    <section className="ingredient-table" aria-label={`Ingredienti: ${mainLabel}`}>
      <div className="ingredient-table-toolbar">
        <div>
          <p className="eyebrow">Dosi proporzionate</p>
          <p className="ingredient-table-status">
            Base: {mainAmount ? `${formatNumber(mainAmount.first)} ${mainAmount.unit}`.trim() : "non disponibile"}
            {factor !== 1 && ` | Scala ${formatNumber(factor)}x`}
          </p>
        </div>
        {mainAmount && !isEditing && (
          <button className="ingredient-scale-action" type="button" onClick={() => setIsEditing(true)}>
            Modifica {mainLabel}
          </button>
        )}
      </div>
      {isEditing && (
        <form className="ingredient-scale-form" onSubmit={submit}>
          <label>
            Nuova quantità per {mainLabel} ({mainAmount?.unit || "unità"})
            <input autoFocus inputMode="decimal" value={target} onChange={(event) => setTarget(event.target.value)} />
          </label>
          <button type="submit">Applica</button>
          <button type="button" onClick={() => setIsEditing(false)}>Annulla</button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
      <div className="table-scroll" tabIndex={0}>
        <table>
          <thead>
            <tr>
              {table.headers.map((header) => {
                const isMain = /<main>/i.test(header);
                return (
                  <th key={header} scope="col">
                    {isMain ? (
                      <button
                        className="main-ingredient-button"
                        type="button"
                        disabled={!mainAmount}
                        onClick={() => setIsEditing(true)}
                        title={mainAmount ? "Modifica la quantità e scala la tabella" : "Quantità principale non scalabile"}
                      >
                        {ingredientName(header)}
                      </button>
                    ) : ingredientName(header)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>{row.map((cell, columnIndex) => renderCell(cell, rowIndex, columnIndex))}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
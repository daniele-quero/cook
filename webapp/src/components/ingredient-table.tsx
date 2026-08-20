"use client";

import { FormEvent, useId, useState } from "react";
import type { IngredientTable, IngredientTableScaleConfig } from "@/lib/ingredient-tables";
import { ingredientName } from "@/lib/ingredient-tables";
import { Tooltip } from "@/components/tooltip";

type ParsedAmount = {
  first: number;
  second?: number;
  unit: string;
  suffix: string;
};

type EditingControl = "quantity" | "yield";

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

export function IngredientTableView({
  table,
  scaleConfig,
}: {
  table: IngredientTable;
  scaleConfig?: IngredientTableScaleConfig;
}) {
  const mainAmount = tableMainAmount(table);
  const [editingControl, setEditingControl] = useState<EditingControl>();
  const [target, setTarget] = useState(mainAmount ? String(mainAmount.first) : "");
  const baseYield = scaleConfig && mainAmount
    ? scaleConfig.baseYield * (mainAmount.first / scaleConfig.baseMainQuantity)
    : undefined;
  const [yieldTarget, setYieldTarget] = useState(baseYield ? String(baseYield) : "");
  const [factor, setFactor] = useState(1);
  const [error, setError] = useState<string>();
  const errorId = useId();
  const mainLabel = ingredientName(
    table.orientation === "vertical"
      ? table.rows.find((row) => row.some((cell) => /<main>/i.test(cell)))?.[0] ?? "Ingrediente principale"
      : table.headers[table.mainColumn],
  );

  function openEditor(control: EditingControl) {
    setEditingControl(control);
    setError(undefined);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingControl === "yield") {
      const parsedYield = Number(yieldTarget.replace(",", "."));
      if (!baseYield || !Number.isInteger(parsedYield) || parsedYield <= 0) {
        setError("Inserisci un numero di piadine intero maggiore di zero.");
        return;
      }

      const nextFactor = parsedYield / baseYield;
      setFactor(nextFactor);
      setTarget(String(mainAmount ? mainAmount.first * nextFactor : ""));
      setError(undefined);
      setEditingControl(undefined);
      return;
    }

    const parsedTarget = Number(target.replace(",", "."));
    if (!mainAmount || !Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setError("Inserisci una quantità maggiore di zero.");
      return;
    }

    const nextFactor = parsedTarget / mainAmount.first;
    setFactor(nextFactor);
    if (baseYield) {
      setYieldTarget(String(baseYield * nextFactor));
    }
    setError(undefined);
    setEditingControl(undefined);
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
          <Tooltip content={mainAmount ? "Modifica la quantità principale e scala automaticamente le dosi della tabella." : "La quantità principale non è disponibile per il calcolo."}>
            <button
              className="main-ingredient-button"
              type="button"
              disabled={!mainAmount}
              onClick={() => openEditor("quantity")}
            >
              {ingredientName(value)}
            </button>
          </Tooltip>
        ) : display}
        {scalable && !baseAmount && /\d/.test(value) && <span className="unscaled-note">Quantità invariata</span>}
      </td>
    );
  }

  return (
    <section
      className="ingredient-table"
      aria-label={`Ingredienti: ${mainLabel}`}
      data-table-orientation={table.orientation}
      data-scale-kind={scaleConfig?.kind}
      data-base-yield={baseYield}
    >
      <div
        className="ingredient-table-toolbar"
      >
        <div>
          <p className="eyebrow">Dosi proporzionate</p>
          <p className="ingredient-table-status" aria-live="polite">
            Base: {mainAmount
              ? scaleConfig
                ? `${formatNumber(scaleConfig.baseMainQuantity)} ${scaleConfig.baseMainUnit}`.trim()
                : `${formatNumber(mainAmount.first)} ${mainAmount.unit}`.trim()
              : "non disponibile"}
            {baseYield !== undefined && ` = ${formatNumber(baseYield)} ${scaleConfig?.yieldLabel}`}
            {factor !== 1 && baseYield !== undefined && ` | Attuale: ${formatNumber(baseYield * factor)} ${scaleConfig?.yieldLabel}`}
            {factor !== 1 && ` | Scala ${formatNumber(factor)}x`}
          </p>
        </div>
        {mainAmount && !editingControl && (
          <div className="ingredient-scale-actions">
            <Tooltip content="Inserisci una nuova quantità principale per ricalcolare tutte le dosi.">
              <button className="ingredient-scale-action" type="button" onClick={() => openEditor("quantity")}>
                Modifica {mainLabel}
              </button>
            </Tooltip>
            {baseYield !== undefined && scaleConfig && (
              <Tooltip content={`Imposta quante ${scaleConfig.yieldLabel} vuoi ottenere e ricalcola la tabella.`}>
                <button className="ingredient-scale-action" type="button" onClick={() => openEditor("yield")}>
                  Modifica numero di {scaleConfig.yieldLabel}
                </button>
              </Tooltip>
            )}
          </div>
        )}
      </div>
      {editingControl && (
        <form className="ingredient-scale-form" onSubmit={submit}>
          {editingControl === "yield" && scaleConfig ? (
            <label htmlFor={`${errorId}-yield`}>
              Numero di {scaleConfig.yieldLabel} da ottenere
              <input
                id={`${errorId}-yield`}
                autoFocus
                type="number"
                inputMode="numeric"
                step="any"
                value={yieldTarget}
                onChange={(event) => setYieldTarget(event.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
              />
            </label>
          ) : (
            <label htmlFor={`${errorId}-quantity`}>
              Nuova quantità per {mainLabel} ({mainAmount?.unit || "unità"})
              <input
                id={`${errorId}-quantity`}
                autoFocus
                type="number"
                inputMode="decimal"
                step="any"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
              />
            </label>
          )}
          <Tooltip content="Applica la nuova quantità e aggiorna le dosi proporzionate.">
            <button type="submit">Applica</button>
          </Tooltip>
          <Tooltip content="Chiudi il modificatore senza cambiare le dosi.">
            <button type="button" onClick={() => setEditingControl(undefined)}>Annulla</button>
          </Tooltip>
          {error && <p id={errorId} role="alert">{error}</p>}
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
                      <Tooltip content={mainAmount ? "Modifica la quantità principale e scala automaticamente le dosi." : "La quantità principale non è disponibile per il calcolo."}>
                        <button
                          className="main-ingredient-button"
                          type="button"
                          disabled={!mainAmount}
                          onClick={() => openEditor("quantity")}
                        >
                          {ingredientName(header)}
                        </button>
                      </Tooltip>
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
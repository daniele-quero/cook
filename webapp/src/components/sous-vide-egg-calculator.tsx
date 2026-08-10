"use client";

import { Fragment, useState } from "react";
import type { RecipeTable } from "@/lib/ingredient-tables";
import {
  eggProfilesFromTable,
  recalculateProfileTimeRange,
  type TimeRange,
} from "./sous-vide-egg-calculator-model";

type SousVideEggCalculatorProps = {
  table: RecipeTable;
};

function numericInput(value: string) {
  const parsed = Number(value.replace(",", "."));
  return value.trim() && Number.isFinite(parsed) ? parsed : undefined;
}

function inlineMarkdown(value: string) {
  return value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => (
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : <Fragment key={index}>{part}</Fragment>
  ));
}

function roundedTimeRange(range: TimeRange) {
  const lower = Math.ceil(range.lower);
  const upper = Math.ceil(range.upper);
  return lower === upper ? `${lower} min` : `${lower}-${upper} min`;
}

function validationMessages(weightGrams: number | undefined, initialTemperatureC: number | undefined) {
  const messages: string[] = [];

  if (weightGrams === undefined) {
    messages.push("Inserisci un peso numerico dell'uovo per calcolare i tempi.");
  } else if (weightGrams < 45 || weightGrams > 75) {
    messages.push("Il calcolo è bloccato: il peso deve essere compreso tra 45 e 75 g. Sono mostrati i tempi standard di tabella.");
  }

  if (initialTemperatureC === undefined) {
    messages.push("Inserisci una temperatura iniziale numerica per calcolare i tempi.");
  } else if (initialTemperatureC < 0 || initialTemperatureC > 8) {
    messages.push("Il calcolo è bloccato: la temperatura iniziale deve restare fra 0 e 8 °C. Sotto 0 °C l'uovo può essere semi-congelato; sopra 8 °C esce dal range frigorifero standard assunto dal protocollo di sicurezza. Sono mostrati i tempi standard di tabella.");
  }

  return messages;
}

export function SousVideEggCalculator({ table }: SousVideEggCalculatorProps) {
  const [weightInput, setWeightInput] = useState("60");
  const [initialTemperatureInput, setInitialTemperatureInput] = useState("3");
  const weightGrams = numericInput(weightInput);
  const initialTemperatureC = numericInput(initialTemperatureInput);
  const messages = validationMessages(weightGrams, initialTemperatureC);
  const calculationAvailable = messages.length === 0;
  const extrapolated = calculationAvailable && Boolean(weightGrams && (weightGrams < 50 || weightGrams > 70));
  const profiles = eggProfilesFromTable(table);
  const timeColumn = table.headers.findIndex((header) => /tempo/i.test(header));

  return (
    <section className="egg-calculator" aria-labelledby="egg-calculator-title" data-testid="sous-vide-egg-calculator">
      <div className="egg-calculator-heading">
        <p className="eyebrow">Tempo su misura</p>
        <h3 id="egg-calculator-title">Profili di cottura ricalcolati</h3>
      </div>
      <p className="egg-calculator-notice">
        Il bagno è sempre già preriscaldato alla temperatura target: questo calcolatore stima solo il tempo di cottura in funzione delle caratteristiche dell&apos;uovo, non simula né consiglia un bagno che parte freddo.
      </p>
      <p className="egg-calculator-notice">
        Peso e temperatura iniziale validi solo nell&apos;intervallo indicato (50-70 g, 0-8°C). Fuori da questo intervallo i tempi non sono stati validati sperimentalmente: vengono mostrati i tempi standard di tabella.
      </p>
      <fieldset className="egg-calculator-controls">
        <legend>Caratteristiche dell&apos;uovo</legend>
        <label htmlFor="egg-weight">
          Peso dell&apos;uovo (g)
          <input
            id="egg-weight"
            data-testid="egg-weight"
            type="number"
            inputMode="decimal"
            min="45"
            max="75"
            step="0.1"
            value={weightInput}
            onChange={(event) => setWeightInput(event.target.value)}
            aria-invalid={weightGrams !== undefined && (weightGrams < 45 || weightGrams > 75)}
          />
        </label>
        <label htmlFor="egg-initial-temperature">
          Temperatura iniziale (°C)
          <input
            id="egg-initial-temperature"
            data-testid="egg-initial-temperature"
            type="number"
            inputMode="decimal"
            min="0"
            max="8"
            step="0.1"
            value={initialTemperatureInput}
            onChange={(event) => setInitialTemperatureInput(event.target.value)}
            aria-invalid={initialTemperatureC !== undefined && (initialTemperatureC < 0 || initialTemperatureC > 8)}
          />
        </label>
      </fieldset>
      <div className="egg-calculator-state" aria-live="polite" data-testid="egg-calculator-state">
        {messages.length > 0 ? (
          <p className="egg-calculator-blocked" role="alert">{messages.join(" ")}</p>
        ) : (
          <p>
            Tempi ricalcolati per {weightGrams} g e {initialTemperatureC} °C.
            {extrapolated && " Nota: stima estrapolata, fuori dal set di calibrazione."}
          </p>
        )}
      </div>
      <div className="table-scroll" tabIndex={0}>
        <table aria-label="Profili di cottura sous vide dell'uovo">
          <thead>
            <tr>
              {table.headers.map((header) => <th key={header} scope="col">{inlineMarkdown(header)}</th>)}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => {
              const profile = profiles[rowIndex];
              const recalculatedTime = calculationAvailable && weightGrams !== undefined && initialTemperatureC !== undefined
                ? roundedTimeRange(recalculateProfileTimeRange(profile, weightGrams, initialTemperatureC))
                : undefined;
              const showsProfileSafety = profile.id === "6" || profile.id === "7";

              return (
                <Fragment key={profile.id}>
                  <tr>
                    {row.map((cell, columnIndex) => (
                      <td
                        key={`${profile.id}-${columnIndex}`}
                        data-testid={columnIndex === timeColumn ? `egg-profile-time-${profile.id}` : undefined}
                        data-time-source={columnIndex === timeColumn ? calculationAvailable ? "recalculated" : "standard" : undefined}
                      >
                        {columnIndex === timeColumn && recalculatedTime ? recalculatedTime : inlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                  {showsProfileSafety && (
                    <tr className="egg-calculator-safety-row">
                      <td colSpan={table.headers.length}>
                        <p data-testid={`egg-profile-safety-${profile.id}`}>
                          ⚠️ In questo profilo il tuorlo NON raggiunge mai la pastorizzazione, indipendentemente dal peso o dalla temperatura di partenza inseriti.
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="egg-calculator-risk-notice">
        Soggetti a rischio (immunocompromessi, anziani, bambini, gravidanza): solo profili 1-5, mai profili 6-7, indipendentemente dai parametri inseriti.
      </p>
    </section>
  );
}
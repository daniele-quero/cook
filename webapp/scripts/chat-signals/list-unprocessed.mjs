// Elenca deterministicamente i chat-traces non ancora processati sotto
// webapp/recipes/chat-traces/<date_bucket>/*.json, raggruppati per
// recipe_slug. Uso: node webapp/scripts/chat-signals/list-unprocessed.mjs
//
// Scopo: dare a Cook-signals-reviewer un elenco esatto e riproducibile dei
// file da valutare, senza affidarsi alla memoria/enumerazione a occhio
// dell'agente (stessa filosofia "meccanica, non giudizio LLM" usata dagli
// script ACE per la contabilità, qui applicata al dominio Cook: contenuto
// delle ricette, non comportamento agentico. Nessun collegamento a ace/:
// solo lo stile di script deterministico è preso a prestito).
//
// Ignora le cartelle "processed" e "reviews" (rispettivamente: trace già
// valutati, log delle valutazioni), e qualunque file con has_pii_risk=true
// senza redaction_notes valorizzato (difensivo: non dovrebbe accadere per
// costruzione lato API, ma se accade va segnalato invece di processato).

import fs from "node:fs";
import path from "node:path";

const chatTracesDir = path.join(import.meta.dirname, "..", "..", "recipes", "chat-traces");
const IGNORED_DIRS = new Set(["processed", "reviews"]);
const DATE_BUCKET_RE = /^\d{4}-\d{2}-\d{2}$/;

function readTrace(fullPath) {
  const raw = fs.readFileSync(fullPath, "utf8");
  return JSON.parse(raw);
}

function main() {
  if (!fs.existsSync(chatTracesDir)) {
    console.log(JSON.stringify({ groups: [], warnings: [`Cartella non trovata: ${chatTracesDir}`] }, null, 2));
    return;
  }

  const warnings = [];
  const byRecipe = new Map();

  const entries = fs.readdirSync(chatTracesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || IGNORED_DIRS.has(entry.name)) continue;
    if (!DATE_BUCKET_RE.test(entry.name)) {
      warnings.push(`Cartella ignorata (nome non e' una data bucket YYYY-MM-DD): ${entry.name}`);
      continue;
    }

    const dateBucket = entry.name;
    const bucketDir = path.join(chatTracesDir, dateBucket);
    const files = fs.readdirSync(bucketDir).filter((f) => f.endsWith(".json"));

    for (const fileName of files) {
      const relPath = `${dateBucket}/${fileName}`;
      const fullPath = path.join(bucketDir, fileName);
      let trace;
      try {
        trace = readTrace(fullPath);
      } catch (err) {
        warnings.push(`File non leggibile/non valido, saltato: ${relPath} (${err.message})`);
        continue;
      }

      if (trace.has_pii_risk && !trace.redaction_notes) {
        warnings.push(`File con has_pii_risk=true e redaction_notes assente, saltato per prudenza: ${relPath}`);
        continue;
      }

      const slug = trace.recipe_slug || "(senza recipe_slug)";
      if (!byRecipe.has(slug)) byRecipe.set(slug, []);
      byRecipe.get(slug).push({
        rel_path: relPath,
        date_bucket: dateBucket,
        recipe_slug: trace.recipe_slug ?? null,
        has_pii_risk: trace.has_pii_risk ?? false,
        redaction_notes: trace.redaction_notes ?? null,
        signals: (trace.signals ?? []).map((s) => ({
          topic_key: s.topic_key,
          gap_type: s.gap_type,
          answer_source: s.answer_source,
          topic_summary: s.topic_summary,
          confidence: s.confidence,
          recipe_scope: s.recipe_scope,
          origin: s.origin,
        })),
      });
    }
  }

  const groups = [...byRecipe.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([recipe_slug, traces]) => ({ recipe_slug, trace_count: traces.length, traces }));

  console.log(JSON.stringify({ groups, warnings }, null, 2));
}

main();

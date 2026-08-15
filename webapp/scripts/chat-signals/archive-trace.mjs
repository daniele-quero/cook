// Archivia deterministicamente uno o più chat-traces già valutati,
// spostandoli da webapp/recipes/chat-traces/<date_bucket>/<file>.json a
// webapp/recipes/chat-traces/processed/<date_bucket>/<file>.json,
// preservando la struttura a cartelle per data.
//
// Uso: node webapp/scripts/chat-signals/archive-trace.mjs <date>/<file>.json [altro/percorso.json ...]
// I percorsi sono relativi a webapp/recipes/chat-traces/ (lo stesso
// formato "rel_path" restituito da list-unprocessed.mjs).
//
// Spostamento fatto SOLO da questo script (mai a mano con l'editor): stessa
// filosofia "meccanica, non giudizio LLM" di ace/scripts/, applicata qui al
// dominio Cook (contenuto ricette) — nessun collegamento a ace/.

import fs from "node:fs";
import path from "node:path";

const chatTracesDir = path.join(import.meta.dirname, "..", "..", "recipes", "chat-traces");
const processedDir = path.join(chatTracesDir, "processed");

function archiveOne(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  if (normalized.startsWith("processed/") || normalized.startsWith("reviews/")) {
    return { relPath, status: "skipped", reason: "già dentro processed/ o reviews/" };
  }

  const sourcePath = path.join(chatTracesDir, normalized);
  if (!fs.existsSync(sourcePath)) {
    return { relPath, status: "error", reason: `file sorgente non trovato: ${sourcePath}` };
  }

  const destPath = path.join(processedDir, normalized);
  if (fs.existsSync(destPath)) {
    return { relPath, status: "error", reason: `destinazione già esistente, non sovrascrivo: ${destPath}` };
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.renameSync(sourcePath, destPath);
  return { relPath, status: "moved", to: path.relative(chatTracesDir, destPath).replace(/\\/g, "/") };
}

function main() {
  const relPaths = process.argv.slice(2);
  if (relPaths.length === 0) {
    console.error("Uso: node archive-trace.mjs <date_bucket>/<file>.json [altro ...]");
    process.exitCode = 1;
    return;
  }

  const results = relPaths.map(archiveOne);
  console.log(JSON.stringify({ results }, null, 2));

  if (results.some((r) => r.status === "error")) process.exitCode = 1;
}

main();

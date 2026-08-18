#!/usr/bin/env node
'use strict';

// Contabilità deterministica dei contatori used/helped/hurt sui bullet
// dei playbook, a partire dalle trace. Non è compito del curator (LLM):
// è pura somma meccanica di playbook_bullets_seen/cited + outcome.status
// su un batch di trace — stessa logica per cui il gate fa solo controlli
// meccanici e lascia il giudizio all'umano.
//
// Batch: stessa definizione di reflector.md — tutti i file in
// ace/traces/ (non in traces/processed/). Va eseguito PRIMA di invocare
// il reflector sullo stesso batch, altrimenti i contatori restano
// indietro rispetto alle trace più recenti (non è un problema di
// correttezza, solo di freschezza: le trace non processate aspettano
// comunque il prossimo run).
//
// Idempotenza: ogni trace processata viene marcata con
// `counted_for_playbook_at` (vedi trace.schema.json) e non viene
// riprocessata in run successivi, indipendentemente da quando reflector
// la sposta in traces/processed/ — le due cose sono disaccoppiate.
//
// Uso:
//   node ace/scripts/update_counters.js            # applica i delta
//   node ace/scripts/update_counters.js --check    # stampa i delta, non scrive

const fs = require('fs');
const path = require('path');
const {
  REPO_ROOT, parsePlaybookFile, serializeFile, listPlaybookFiles, listArchiveFiles,
} = require('./lib/playbook');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function collectUnprocessedTraces() {
  // Guarda sia ace/traces/ sia ace/traces/processed/: la marcatura
  // counted_for_playbook_at e lo spostamento in processed/ (fatto dal
  // reflector) sono disaccoppiati, quindi una trace può finire in
  // processed/ prima di essere mai stata contata (es. run passati in cui
  // questo script non è stato lanciato). Va comunque contata una sola
  // volta, indipendentemente da dove si trova.
  const dirs = [
    path.join(REPO_ROOT, 'ace', 'traces'),
    path.join(REPO_ROOT, 'ace', 'traces', 'processed'),
  ];

  const traces = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.json'))
      .map((e) => path.join(dir, e.name));

    for (const abs of files) {
      const doc = readJSON(abs);
      if (doc.counted_for_playbook_at) continue; // già contata in un run precedente
      traces.push({ abs, doc });
    }
  }
  return traces;
}

function computeDeltas(traces) {
  const deltas = new Map(); // id -> { used, helped, hurt }
  const warnings = [];

  const bump = (id, field) => {
    if (!deltas.has(id)) deltas.set(id, { used: 0, helped: 0, hurt: 0 });
    deltas.get(id)[field] += 1;
  };

  for (const { doc, abs } of traces) {
    const seen = doc.playbook_bullets_seen || [];
    const cited = doc.playbook_bullets_cited || [];
    const status = doc.outcome && doc.outcome.status;

    for (const id of seen) bump(id, 'used');

    for (const id of cited) {
      if (!seen.includes(id)) {
        warnings.push(`${path.basename(abs)}: id "${id}" citato ma non presente in playbook_bullets_seen — contato comunque come used, ma segnalo l'incoerenza.`);
        bump(id, 'used');
      }
      if (status === 'success') bump(id, 'helped');
      else if (status === 'failure') bump(id, 'hurt');
      // "partial": nessun segnale su helped/hurt, resta solo used.
    }
  }

  return { deltas, warnings };
}

function applyDeltas(deltas) {
  const touchedFiles = new Map(); // relPath -> parsed
  const applied = [];
  const notFound = [];
  const ambiguous = [];

  const allRelPaths = [...listPlaybookFiles(), ...listArchiveFiles()];

  function loadFile(relPath) {
    if (touchedFiles.has(relPath)) return touchedFiles.get(relPath);
    const abs = path.join(REPO_ROOT, relPath);
    const parsed = parsePlaybookFile(fs.readFileSync(abs, 'utf8'));
    touchedFiles.set(relPath, parsed);
    return parsed;
  }

  for (const [id, delta] of deltas) {
    // BUG STORICO (corretto qui): si cercava il bullet scorrendo
    // allRelPaths e ci si fermava al primo file in cui lo si trovava,
    // attribuendo silenziosamente i contatori al bullet sbagliato quando
    // lo stesso ID esisteva (per un difetto di integrità dei dati) in più
    // file — è esattamente cosi' che i contatori used/helped/hurt del
    // vero 'P-013' (webapp-orchestrator) sono finiti assorbiti dal
    // bullet 'P-013' di webapp-frontend per settimane prima che la
    // collisione fosse scoperta. Le trace non portano informazione di
    // scope per gli ID citati, quindi qui non si può disambiguare come in
    // apply_delta.js (che ha final_scope): l'unica scelta sicura è NON
    // decidere da soli, segnalare l'ambiguità e non scrivere nulla per
    // quell'ID finché la collisione non è risolta a livello di playbook.
    const matches = [];
    for (const relPath of allRelPaths) {
      const parsed = loadFile(relPath);
      const bullet = parsed.bullets.find((b) => b.id === id);
      if (bullet) matches.push({ relPath, bullet });
    }
    if (!matches.length) { notFound.push(id); continue; }
    // Solo le occorrenze NON deprecated contano come ambigue: un bullet
    // deprecated in archivio che condivide per storia lo stesso ID con un
    // bullet attivo altrove (es. una collisione passata già risolta con
    // una DEPRECATE mirata) è storico e non riceve più scritture — non è
    // una vera ambiguità su cui attribuire il delta di oggi.
    const liveMatches = matches.filter((m) => m.bullet.status !== 'deprecated');
    if (liveMatches.length > 1) {
      ambiguous.push({ id, files: liveMatches.map((m) => m.relPath) });
      continue;
    }
    const found = liveMatches[0] || matches[0];
    found.bullet.used += delta.used;
    found.bullet.helped += delta.helped;
    found.bullet.hurt += delta.hurt;
    applied.push({
      id, file: found.relPath, delta, totals: { used: found.bullet.used, helped: found.bullet.helped, hurt: found.bullet.hurt },
    });
  }

  return {
    touchedFiles, applied, notFound, ambiguous,
  };
}

function run({ checkOnly = false, verbose = true } = {}) {
  const traces = collectUnprocessedTraces();
  if (!traces.length) {
    if (verbose) console.log('Nessuna trace non ancora contata in ace/traces/.');
    return { applied: [], warnings: [] };
  }

  const { deltas, warnings } = computeDeltas(traces);
  if (verbose) {
    for (const w of warnings) console.log(`ATTENZIONE: ${w}`);
    if (!deltas.size) console.log(`${traces.length} trace lette, nessun bullet citato/visto (playbook_bullets_seen/cited vuoti).`);
  }

  const { touchedFiles, applied, notFound, ambiguous } = applyDeltas(deltas);

  if (verbose) {
    for (const a of applied) {
      console.log(`[${a.id}] +used:${a.delta.used} +helped:${a.delta.helped} +hurt:${a.delta.hurt} → totali used:${a.totals.used} helped:${a.totals.helped} hurt:${a.totals.hurt} (${a.file})`);
    }
    for (const id of notFound) {
      console.log(`ATTENZIONE: id "${id}" citato in una trace ma non trovato in nessun playbook/archive — ignorato.`);
    }
    for (const a of ambiguous) {
      console.log(`ATTENZIONE: id "${a.id}" citato in una trace ma AMBIGUO — presente in più file (${a.files.join(', ')}). Integrità dei dati compromessa (collisione di ID): contatori NON aggiornati per questo ID finché la collisione non viene risolta a livello di playbook (vedi ace/scripts/lib/playbook.js#detectIdCollisions).`);
    }
  }

  if (checkOnly) {
    if (verbose) console.log(`(--check) ${traces.length} trace, ${applied.length} bullet aggiornati, nessuna scrittura eseguita.`);
    return {
      applied, warnings, ambiguous, wouldWrite: touchedFiles.size > 0,
    };
  }

  for (const [relPath, parsed] of touchedFiles) {
    const abs = path.join(REPO_ROOT, relPath);
    fs.writeFileSync(abs, serializeFile(parsed.prefix, parsed.bullets, parsed.suffix));
  }

  const now = new Date().toISOString();
  for (const { abs, doc } of traces) {
    doc.counted_for_playbook_at = now;
    fs.writeFileSync(abs, `${JSON.stringify(doc, null, 2)}\n`);
  }

  if (verbose) {
    console.log(`Contate ${traces.length} trace, aggiornati ${applied.length} bullet in ${touchedFiles.size} file playbook.`);
  }

  return { applied, warnings, ambiguous };
}

module.exports = { run };

if (require.main === module) {
  run({ checkOnly: process.argv.includes('--check') });
}

#!/usr/bin/env node
'use strict';

// Gate deterministico: valida un file di decisioni del curator PRIMA che
// apply_delta.js tocchi i playbook. Uso:
//   node ace/scripts/gate.js <decisions-file.json> [--sign-off]
//
// Importante: questo script fa SOLO controlli meccanici — struttura, enum,
// collisioni di ID, compatibilità tra operazione e stato attuale del
// bullet (es. PROMOTE solo su 'quarantined', niente UPDATE/DEPRECATE su
// bullet già 'deprecated', niente MERGE che includa il target stesso o
// bullet già deprecated), esistenza delle trace citate come evidenza. Il
// "set di regressione" del disegno originale del progetto si divide quindi
// in due parti distinte, non in una sola:
// - la parte strutturale/di stato sopra: automatizzata qui, deterministica.
// - il conflitto SEMANTICO tra il nuovo contenuto e gli altri bullet attivi
//   dello stesso scope (es. una nuova regola che ne contraddice un'altra
//   già attiva senza essere marcata come tale): questo NON è automatizzato
//   di proposito, richiede un giudizio (umano o LLM), non un controllo
//   deterministico — è per questo che gh/ace/warden e cl/ace/warden lo pongono esplicitamente
//   come checklist alla revisione umana prima del sign-off (vedi
//   ace/prompts/warden.md), invece di provare a scriptarlo qui.
// Per questo il gate non firma mai da solo: richiede sempre --sign-off
// esplicito, che rappresenta la revisione umana.

const fs = require('fs');
const path = require('path');
const {
  REPO_ROOT, loadBulletSchema, collectExistingIds, scopeToRelPath, findAllBulletLocations, detectIdCollisions,
} = require('./lib/playbook');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const args = process.argv.slice(2);
  const decisionsPathArg = args.find((a) => !a.startsWith('--'));
  const signOff = args.includes('--sign-off');

  if (!decisionsPathArg) {
    console.error('Uso: node ace/scripts/gate.js <decisions-file.json> [--sign-off]');
    process.exit(2);
  }

  const decisionsPath = path.resolve(decisionsPathArg);
  const decisionsRel = path.relative(REPO_ROOT, decisionsPath).replace(/\\/g, '/');
  const decisionsDoc = readJSON(decisionsPath);

  const proposalsPath = path.join(path.dirname(decisionsPath), decisionsDoc.source_proposals_file);
  const proposalsDoc = fs.existsSync(proposalsPath) ? readJSON(proposalsPath) : null;
  const proposalsById = new Map();
  if (proposalsDoc) {
    for (const p of proposalsDoc.proposals) proposalsById.set(p.proposal_id, p);
  }

  const schema = loadBulletSchema();
  const agentEnum = schema.properties.scope.properties.agent.enum;
  const scopeTypeEnum = schema.properties.scope.properties.type.enum;
  const idPattern = new RegExp(schema.properties.id.pattern);

  const existingIds = collectExistingIds();
  const tracesProcessedDir = path.join(REPO_ROOT, 'ace', 'traces', 'processed');
  const processedTraceFiles = fs.existsSync(tracesProcessedDir) ? fs.readdirSync(tracesProcessedDir) : [];

  const results = [];
  let allMechanicalPass = true;

  for (const d of decisionsDoc.decisions) {
    const checks = [];
    const fail = (msg) => checks.push({ pass: false, message: msg });
    const pass = (msg) => checks.push({ pass: true, message: msg });

    if (d.operation === 'REJECT') {
      pass('REJECT non richiede validazione strutturale.');
      results.push({ proposal_id: d.proposal_id, operation: d.operation, mechanical_status: 'PASS', checks });
      continue;
    }

    if (!d.final_scope || !scopeTypeEnum.includes(d.final_scope.type)) {
      fail(`scope.type mancante o non valido: ${d.final_scope && d.final_scope.type}`);
    } else if (d.final_scope.type === 'agent' && !agentEnum.includes(d.final_scope.agent)) {
      fail(`scope.agent non valido: ${d.final_scope.agent}`);
    } else if (d.final_scope.type === 'family' && !d.final_scope.family) {
      fail('scope.family mancante per scope.type=family');
    } else {
      pass('scope valido');
    }

    if (!d.target_bullet_id || !idPattern.test(d.target_bullet_id)) {
      fail(`target_bullet_id non valido: ${d.target_bullet_id}`);
    } else if (d.operation === 'ADD') {
      if (existingIds.has(d.target_bullet_id)) fail(`ID già esistente, non riutilizzabile per ADD: ${d.target_bullet_id}`);
      else pass('ID nuovo, nessuna collisione');
    } else if (['UPDATE', 'DEPRECATE', 'PROMOTE'].includes(d.operation)) {
      // Non ci si affida più a collectExistingIds() (una sola entry per
      // ID, potenzialmente ambigua): si guarda l'elenco COMPLETO dei file
      // in cui l'ID compare, e si richiede che il final_scope dichiarato
      // corrisponda a uno di essi quando l'ID è ambiguo (presente in più
      // di un file). Questo è il controllo che avrebbe impedito ad
      // apply_delta.js di operare sul file sbagliato in caso di
      // collisione di ID (vedi playbooks/archive/webapp-orchestrator.md).
      const locations = findAllBulletLocations(d.target_bullet_id);
      const expectedRel = d.final_scope && scopeTypeEnum.includes(d.final_scope.type)
        ? scopeToRelPath(d.final_scope) : null;
      const atExpected = expectedRel ? locations.find((l) => l.relPath === expectedRel) : null;

      if (!locations.length) {
        fail(`Bullet non trovato per ${d.operation}: ${d.target_bullet_id}`);
      } else if (locations.length > 1 && !atExpected) {
        fail(`ID "${d.target_bullet_id}" ambiguo: trovato in più file (${locations.map((l) => l.relPath).join(', ')}) ma nessuno corrisponde al final_scope dichiarato (${expectedRel || 'n/d'}) — impossibile determinare in modo sicuro su quale bullet operare senza disambiguare esplicitamente lo scope nella decisione.`);
      } else {
        const existing = atExpected || locations[0];
        if (locations.length > 1) {
          pass(`ID ambiguo (${locations.length} occorrenze) ma risolto in modo sicuro tramite final_scope: operazione su "${existing.relPath}"`);
        }
        if (d.operation === 'PROMOTE' && existing.status !== 'quarantined') {
          fail(`PROMOTE richiede un bullet in stato 'quarantined', trovato '${existing.status}': ${d.target_bullet_id}`);
        } else if (d.operation === 'DEPRECATE' && existing.status === 'deprecated') {
          fail(`DEPRECATE su bullet già 'deprecated': ${d.target_bullet_id}`);
        } else if (d.operation === 'UPDATE' && existing.status === 'deprecated') {
          fail(`UPDATE su bullet 'deprecated': ${d.target_bullet_id} — gli id deprecati non si riattivano con UPDATE, serve un ADD nuovo o un PROMOTE se era solo quarantined`);
        } else {
          pass(`bullet esistente trovato in "${existing.relPath}", stato '${existing.status}' compatibile con ${d.operation}`);
        }
      }
    } else if (d.operation === 'MERGE') {
      const sources = d.merged_from || [];
      if (!sources.length) {
        fail('MERGE richiede merged_from non vuoto');
      } else if (sources.includes(d.target_bullet_id)) {
        fail(`merged_from non può includere il target_bullet_id stesso: ${d.target_bullet_id}`);
      } else {
        const missing = sources.filter((id) => !existingIds.has(id));
        const alreadyDeprecated = sources.filter((id) => existingIds.get(id) && existingIds.get(id).status === 'deprecated');
        if (missing.length) fail(`merged_from con id inesistenti: ${missing.join(', ')}`);
        else if (alreadyDeprecated.length) fail(`merged_from con id già 'deprecated', non fondibili: ${alreadyDeprecated.join(', ')}`);
        else pass('tutti i merged_from esistono e non sono già deprecated');
      }
    }

    if (!d.final_content || !d.final_content.trim()) fail('final_content mancante o vuoto');
    else pass('final_content presente');

    if (d.operation === 'ADD') {
      const proposal = proposalsById.get(d.proposal_id);
      if (!proposal) {
        fail(`Proposta di origine non trovata: ${d.proposal_id} (file ${decisionsDoc.source_proposals_file})`);
      } else {
        const supporting = proposal.supporting_task_ids || [];
        if (!supporting.length) {
          fail('Nessuna supporting_task_ids nella proposta di origine: evidenza non citabile.');
        } else {
          const missingTraces = supporting.filter(
            (taskId) => !processedTraceFiles.some((f) => f.startsWith(`${taskId}__`)),
          );
          if (missingTraces.length) {
            fail(`Trace di evidenza non trovate in ace/traces/processed/: ${missingTraces.join(', ')}`);
          } else {
            pass(`Evidenza verificata: ${supporting.length} task citato/i, trace presenti in ace/traces/processed/.`);
          }
        }
      }
    }

    const decisionPass = checks.every((c) => c.pass);
    if (!decisionPass) allMechanicalPass = false;
    results.push({
      proposal_id: d.proposal_id,
      operation: d.operation,
      target_bullet_id: d.target_bullet_id,
      mechanical_status: decisionPass ? 'PASS' : 'FAIL',
      checks,
    });
  }

  // Controllo batch-level (non per singola decisione): qualunque
  // collisione di ID esistente nell'intero universo playbook+archivio
  // DEVE essere toccata da almeno una decisione di questo batch (una
  // UPDATE/DEPRECATE/PROMOTE il cui target_bullet_id coincide con l'ID in
  // collisione), altrimenti il batch la lascerebbe silenziosamente
  // irrisolta per un altro ciclo — esattamente la condizione che ha
  // permesso alla collisione storica su 'P-013' di restare invisibile per
  // più batch prima di essere scoperta. Le collisioni toccate da questo
  // batch sono già validate nel dettaglio (scope/ambiguità) dal controllo
  // per-decisione sopra.
  const idsTouchedByBatch = new Set(
    decisionsDoc.decisions
      .filter((d) => d.operation !== 'REJECT' && d.target_bullet_id)
      .map((d) => d.target_bullet_id),
  );
  const unresolvedCollisions = detectIdCollisions().filter((c) => !idsTouchedByBatch.has(c.id));
  if (unresolvedCollisions.length) {
    allMechanicalPass = false;
    results.push({
      proposal_id: 'BATCH-ID-COLLISION-CHECK',
      operation: 'CHECK',
      mechanical_status: 'FAIL',
      checks: unresolvedCollisions.map((c) => ({
        pass: false,
        message: `ID "${c.id}" duplicato tra più file playbook (${c.files.join(', ')}) e non toccato da nessuna decisione di questo batch: integrità dei dati compromessa, va risolto (es. con una decisione DEPRECATE/UPDATE dedicata) prima che questo batch possa essere firmato.`,
      })),
    });
  }

  const report = {
    batch_id: decisionsDoc.batch_id,
    gated_at: new Date().toISOString(),
    source_decisions_file: decisionsRel,
    all_mechanical_pass: allMechanicalPass,
    replay_note: "Il set di regressione si divide in due parti: (1) struttura + compatibilità operazione/stato del bullet (PROMOTE solo da quarantined, niente UPDATE/DEPRECATE/MERGE su bullet già deprecated, ecc.) + esistenza dell'evidenza citata — verificate meccanicamente qui; (2) conflitto semantico col resto del playbook dello stesso scope — non automatizzato di proposito (richiede giudizio umano o LLM), posto come checklist esplicita da gh/ace/warden o cl/ace/warden alla revisione umana prima del sign-off. Il sign-off umano resta obbligatorio prima che apply_delta possa procedere.",
    signed_off: false,
    results,
  };

  const reportPath = decisionsPath.replace(/-decisions\.json$/, '-gate-report.json');

  if (signOff) {
    if (!allMechanicalPass) {
      console.error('Impossibile firmare: alcuni controlli meccanici falliscono. Vedi report per i dettagli.');
    } else {
      report.signed_off = true;
      report.signed_off_at = new Date().toISOString();
    }
  }

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const reportRel = path.relative(REPO_ROOT, reportPath).replace(/\\/g, '/');
  console.log(`Gate report scritto in ${reportRel}`);
  console.log(`Esito meccanico complessivo: ${allMechanicalPass ? 'PASS' : 'FAIL'}${signOff ? `, signed_off: ${report.signed_off}` : ''}`);
  if (!allMechanicalPass) process.exitCode = 1;
}

main();

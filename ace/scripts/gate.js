#!/usr/bin/env node
'use strict';

// Gate deterministico: valida un file di decisioni del curator PRIMA che
// apply_delta.js tocchi i playbook. Uso:
//   node ace/scripts/gate.js <decisions-file.json> [--sign-off]
//
// Importante: questo script fa SOLO controlli meccanici (struttura, enum,
// collisioni di ID, esistenza delle trace citate come evidenza). NON
// esegue il "replay del task originale" né un "set di regressione fisso"
// nel senso semantico previsto dal disegno originale del progetto —
// entrambi richiederebbero un giudizio (umano o LLM), non un controllo
// deterministico. Per questo il gate non firma mai da solo: richiede
// sempre --sign-off esplicito, che rappresenta la revisione umana.

const fs = require('fs');
const path = require('path');
const {
  REPO_ROOT, loadBulletSchema, collectExistingIds,
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
      if (!existingIds.has(d.target_bullet_id)) fail(`Bullet non trovato per ${d.operation}: ${d.target_bullet_id}`);
      else pass('bullet esistente trovato');
    } else if (d.operation === 'MERGE') {
      const sources = d.merged_from || [];
      if (!sources.length) {
        fail('MERGE richiede merged_from non vuoto');
      } else {
        const missing = sources.filter((id) => !existingIds.has(id));
        if (missing.length) fail(`merged_from con id inesistenti: ${missing.join(', ')}`);
        else pass('tutti i merged_from esistono');
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

  const report = {
    batch_id: decisionsDoc.batch_id,
    gated_at: new Date().toISOString(),
    source_decisions_file: decisionsRel,
    all_mechanical_pass: allMechanicalPass,
    replay_note: "Il replay semantico del task originale e il set di regressione fisso non sono automatizzati da questo script (richiederebbero un giudizio umano o LLM, non un controllo deterministico): qui si verifica solo che l'evidenza citata esista davvero e che la struttura sia valida. Il sign-off umano resta obbligatorio prima che apply_delta possa procedere.",
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

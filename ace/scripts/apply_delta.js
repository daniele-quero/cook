#!/usr/bin/env node
'use strict';

// Applica le operazioni di un batch curato ai file playbooks/*.md, ma solo
// se il gate report referenziato ha signed_off:true e all_mechanical_pass:true.
// Uso:
//   node ace/scripts/apply_delta.js <gate-report.json>
//
// Dopo l'applicazione, incatena retrieval.js (cosi' .github/copilot-
// instructions.md non resta mai disallineato in attesa di un run manuale
// dimenticato), poi sposta proposte + decisioni + report del batch in
// ace/proposals/applied/, cosi' non vengono ri-processati.

const fs = require('fs');
const path = require('path');
const {
  REPO_ROOT, scopeToRelPath, parsePlaybookFile, serializeFile,
  stripEmptyPlaceholder, listPlaybookFiles,
} = require('./lib/playbook');
const retrieval = require('./retrieval');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const reportPathArg = process.argv[2];
  if (!reportPathArg) {
    console.error('Uso: node ace/scripts/apply_delta.js <gate-report.json>');
    process.exit(2);
  }

  const reportPath = path.resolve(reportPathArg);
  const report = readJSON(reportPath);

  if (!report.signed_off) {
    console.error('Il gate report non è firmato (signed_off: false). Rilancia gate.js con --sign-off dopo revisione umana prima di applicare.');
    process.exit(1);
  }
  if (!report.all_mechanical_pass) {
    console.error('Il gate report segnala controlli meccanici falliti: rifiuto di procedere.');
    process.exit(1);
  }

  const decisionsPath = path.join(REPO_ROOT, report.source_decisions_file);
  const decisionsDoc = readJSON(decisionsPath);
  const proposalsPath = path.join(path.dirname(decisionsPath), decisionsDoc.source_proposals_file);
  const proposalsDoc = fs.existsSync(proposalsPath) ? readJSON(proposalsPath) : { proposals: [] };
  const proposalsById = new Map(proposalsDoc.proposals.map((p) => [p.proposal_id, p]));

  const statusByProposal = new Map(report.results.map((r) => [r.proposal_id, r.mechanical_status]));

  const touchedFiles = new Map(); // relPath -> parsed { prefix, bullets, suffix }

  function loadFile(relPath) {
    if (touchedFiles.has(relPath)) return touchedFiles.get(relPath);
    const abs = path.join(REPO_ROOT, relPath);
    const raw = fs.readFileSync(abs, 'utf8');
    const parsed = parsePlaybookFile(raw);
    touchedFiles.set(relPath, parsed);
    return parsed;
  }

  function findBullet(id) {
    for (const relPath of listPlaybookFiles()) {
      const parsed = loadFile(relPath);
      const idx = parsed.bullets.findIndex((b) => b.id === id);
      if (idx !== -1) return { relPath, parsed, idx };
    }
    return null;
  }

  function provenanceFor(decision) {
    const proposal = proposalsById.get(decision.proposal_id);
    const supporting = proposal ? (proposal.supporting_task_ids || []) : [];
    const parts = [];
    if (decision.merged_from && decision.merged_from.length) parts.push(`merged_from=[${decision.merged_from.join(', ')}]`);
    if (supporting.length) parts.push(`source_trace_ids=[${supporting.join(', ')}]`);
    parts.push(`created_at=${decisionsDoc.decided_at}`);
    parts.push('created_by=reflector+curator');
    parts.push(`batch_id=${decisionsDoc.batch_id}`);
    return parts.join('; ');
  }

  const applied = [];
  const skipped = [];

  for (const d of decisionsDoc.decisions) {
    if (d.operation === 'REJECT') {
      skipped.push({ proposal_id: d.proposal_id, reason: 'REJECT' });
      continue;
    }
    if (statusByProposal.get(d.proposal_id) !== 'PASS') {
      skipped.push({ proposal_id: d.proposal_id, reason: 'mechanical_status non PASS nel gate report' });
      continue;
    }

    if (d.operation === 'ADD') {
      const relPath = scopeToRelPath(d.final_scope);
      const parsed = loadFile(relPath);
      parsed.prefix = stripEmptyPlaceholder(parsed.prefix);
      parsed.bullets.push({
        id: d.target_bullet_id,
        status: d.initial_status || 'active',
        used: 0,
        helped: 0,
        hurt: 0,
        content: d.final_content,
        tags: [],
        provenance: provenanceFor(d),
      });
      applied.push({ proposal_id: d.proposal_id, operation: 'ADD', file: relPath, id: d.target_bullet_id });
      continue;
    }

    if (d.operation === 'UPDATE') {
      const found = findBullet(d.target_bullet_id);
      if (!found) { skipped.push({ proposal_id: d.proposal_id, reason: `bullet ${d.target_bullet_id} non trovato` }); continue; }
      found.parsed.bullets[found.idx].content = d.final_content;
      const targetRel = d.final_scope ? scopeToRelPath(d.final_scope) : found.relPath;
      if (targetRel !== found.relPath) {
        const [moved] = found.parsed.bullets.splice(found.idx, 1);
        const newParsed = loadFile(targetRel);
        newParsed.prefix = stripEmptyPlaceholder(newParsed.prefix);
        newParsed.bullets.push(moved);
      }
      applied.push({ proposal_id: d.proposal_id, operation: 'UPDATE', file: targetRel, id: d.target_bullet_id });
      continue;
    }

    if (d.operation === 'PROMOTE') {
      const found = findBullet(d.target_bullet_id);
      if (!found) { skipped.push({ proposal_id: d.proposal_id, reason: `bullet ${d.target_bullet_id} non trovato` }); continue; }
      found.parsed.bullets[found.idx].status = 'active';
      applied.push({ proposal_id: d.proposal_id, operation: 'PROMOTE', file: found.relPath, id: d.target_bullet_id });
      continue;
    }

    if (d.operation === 'DEPRECATE') {
      const found = findBullet(d.target_bullet_id);
      if (!found) { skipped.push({ proposal_id: d.proposal_id, reason: `bullet ${d.target_bullet_id} non trovato` }); continue; }
      const [moved] = found.parsed.bullets.splice(found.idx, 1);
      moved.status = 'deprecated';
      const archiveRel = path.join('playbooks', 'archive', path.basename(found.relPath));
      const archiveAbs = path.join(REPO_ROOT, archiveRel);
      let archiveParsed;
      if (touchedFiles.has(archiveRel)) {
        archiveParsed = touchedFiles.get(archiveRel);
      } else if (fs.existsSync(archiveAbs)) {
        archiveParsed = parsePlaybookFile(fs.readFileSync(archiveAbs, 'utf8'));
        touchedFiles.set(archiveRel, archiveParsed);
      } else {
        archiveParsed = {
          prefix: `# Archivio — ${path.basename(found.relPath, '.md')}\n\nBullet deprecated spostati qui da \`playbooks/${path.basename(found.relPath)}\`.`,
          bullets: [],
          suffix: '',
        };
        touchedFiles.set(archiveRel, archiveParsed);
      }
      archiveParsed.bullets.push(moved);
      applied.push({ proposal_id: d.proposal_id, operation: 'DEPRECATE', file: archiveRel, id: d.target_bullet_id });
      continue;
    }

    if (d.operation === 'MERGE') {
      const sourceIds = d.merged_from || [];
      const targets = sourceIds.map(findBullet).filter(Boolean);
      if (!targets.length) { skipped.push({ proposal_id: d.proposal_id, reason: 'nessun merged_from trovato' }); continue; }
      for (const t of targets) t.parsed.bullets.splice(t.idx, 1);
      const relPath = scopeToRelPath(d.final_scope);
      const parsed = loadFile(relPath);
      parsed.prefix = stripEmptyPlaceholder(parsed.prefix);
      parsed.bullets.push({
        id: d.target_bullet_id,
        status: d.initial_status || 'active',
        used: 0,
        helped: 0,
        hurt: 0,
        content: d.final_content,
        tags: [],
        provenance: provenanceFor(d),
      });
      applied.push({
        proposal_id: d.proposal_id, operation: 'MERGE', file: relPath, id: d.target_bullet_id, merged_from: sourceIds,
      });
      continue;
    }

    skipped.push({ proposal_id: d.proposal_id, reason: `operazione sconosciuta: ${d.operation}` });
  }

  for (const [relPath, parsed] of touchedFiles) {
    const abs = path.join(REPO_ROOT, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, serializeFile(parsed.prefix, parsed.bullets, parsed.suffix));
  }

  if (touchedFiles.size > 0) {
    console.log('Playbook aggiornati: rilancio retrieval.js per risincronizzare .github/copilot-instructions.md...');
    retrieval.run({ checkOnly: false, verbose: true });
  }

  const appliedDir = path.join(REPO_ROOT, 'ace', 'proposals', 'applied');
  fs.mkdirSync(appliedDir, { recursive: true });
  for (const p of [proposalsPath, decisionsPath, reportPath]) {
    if (fs.existsSync(p)) fs.renameSync(p, path.join(appliedDir, path.basename(p)));
  }

  console.log(`Applicate ${applied.length} operazioni, ${skipped.length} saltate.`);
  console.log('File playbook modificati:', [...touchedFiles.keys()].join(', ') || '(nessuno)');
  console.log('Batch spostato in ace/proposals/applied/.');
  if (skipped.length) {
    console.log('Saltate:', JSON.stringify(skipped, null, 2));
  }
}

main();

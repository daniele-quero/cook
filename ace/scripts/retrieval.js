#!/usr/bin/env node
'use strict';

// Legge tutti i playbooks/*.md, applica il filtro di sicurezza, e
// sincronizza il risultato (solo id + content, mai contatori/provenance):
// - i bullet di scope "global" vanno in .github/copilot-instructions.md
//   (l'unico file che Copilot inietta automaticamente in ogni sessione in
//   questo scenario — chat interattiva VS Code, nessun hook nativo).
// - i bullet di scope "agent"/"family" vanno OGNUNO nel proprio file
//   dedicato .github/instructions/ace-<scope>.instructions.md, perché
//   iniettare tutto in copilot-instructions.md metterebbe i bullet di
//   ogni agente nel contesto di TUTTI gli altri (bloating), non solo di
//   chi dovrebbe applicarli.
// - questi file dedicati NON si auto-attaccano via `applyTo` (gli agenti
//   di questo team sono conversazionali, senza un glob di file affidabile
//   a cui legarsi): ogni Cook-*.agent.md li legge esplicitamente con
//   read_file come primo passo del proprio workflow. Vedi ace/README.md.
//
// Uso:
//   node ace/scripts/retrieval.js            # scrive i file
//   node ace/scripts/retrieval.js --check    # stampa cosa cambierebbe, non scrive

const fs = require('fs');
const path = require('path');
const {
  REPO_ROOT, parsePlaybookFile, listPlaybookFiles,
} = require('./lib/playbook');

const BEGIN_MARKER = '<!-- ACE:BEGIN — generato da ace/scripts/retrieval.js, non modificare a mano tra questi marker -->';
const END_MARKER = '<!-- ACE:END -->';

// Soglia del filtro di sicurezza: un bullet con almeno MIN_SAMPLES usi e
// hurt > helped viene escluso immediatamente dal contesto servito, anche
// se il suo status persistito sui file è ancora "active" (lo status
// persistito si aggiorna solo al prossimo batch curator/apply_delta;
// questo controllo live esiste apposta per non aspettare quel batch).
const MIN_SAMPLES_FOR_LIVE_EXCLUSION = 5;

const AGENT_SCOPES = ['cook-orchestrator', 'cook-chef', 'cook-chemist', 'cook-biosafety', 'cook-physicist', 'cook-writer'];

function scopeKeyFromRelPath(relPath) {
  const base = path.basename(relPath, '.md');
  if (relPath.includes(`${path.sep}families${path.sep}`) || relPath.includes('/families/')) {
    return `family:${base}`;
  }
  return base; // "_global", "cook-orchestrator", "cook-chef", ecc.
}

function collectBullets() {
  const byScope = new Map(); // scopeKey -> [{id, content}]
  const excluded = []; // { id, scope, reason }

  for (const relPath of listPlaybookFiles()) {
    const raw = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
    const { bullets } = parsePlaybookFile(raw);
    const scopeKey = scopeKeyFromRelPath(relPath);

    for (const b of bullets) {
      if (b.status === 'deprecated') {
        excluded.push({ id: b.id, scope: scopeKey, reason: 'status=deprecated' });
        continue;
      }
      if (b.status === 'quarantined') {
        excluded.push({ id: b.id, scope: scopeKey, reason: 'status=quarantined' });
        continue;
      }
      if (b.used >= MIN_SAMPLES_FOR_LIVE_EXCLUSION && b.hurt > b.helped) {
        excluded.push({
          id: b.id,
          scope: scopeKey,
          reason: `esclusione live: used=${b.used} hurt=${b.hurt} > helped=${b.helped} (soglia campioni: ${MIN_SAMPLES_FOR_LIVE_EXCLUSION}) — segnalare al prossimo batch curator per DEPRECATE/quarantena formale`,
        });
        continue;
      }
      if (!byScope.has(scopeKey)) byScope.set(scopeKey, []);
      byScope.get(scopeKey).push({ id: b.id, content: b.content });
    }
  }

  return { byScope, excluded };
}

function renderBulletList(bullets) {
  return bullets.map((b) => `- **[${b.id}]** ${b.content.replace(/\n+/g, ' ')}`).join('\n');
}

function renderGlobalBlock(bullets) {
  const preamble = [
    '## Lezioni operative ACE (playbook globale)',
    '',
    'Generato automaticamente da `ace/scripts/retrieval.js` a partire da `playbooks/_global.md`. Si applicano a **tutti** gli agenti del team Cook (orchestratore e subagenti). Se applichi una di queste lezioni, citane l\'id tra parentesi quadre (es. `[P-003]`).',
    '',
  ].join('\n');
  if (!bullets || !bullets.length) return `${preamble}\n_Nessun bullet attivo al momento della generazione._`;
  return `${preamble}\n${renderBulletList(bullets)}`;
}

function renderAgentBlock(scopeKey, bullets) {
  const label = scopeKey.startsWith('family:') ? `family "${scopeKey.slice(7)}"` : `\`${scopeKey}\``;
  const preamble = [
    `## Lezioni operative ACE per ${label}`,
    '',
    `Generato automaticamente da \`ace/scripts/retrieval.js\` a partire da \`playbooks/${scopeKey.startsWith('family:') ? `families/${scopeKey.slice(7)}` : scopeKey}.md\`. Non auto-iniettato da Copilot: va letto esplicitamente con \`read_file\` (vedi il passo dedicato nel workflow dell'agente). Se applichi una di queste lezioni, citane l'id tra parentesi quadre (es. \`[P-002]\`).`,
    '',
  ].join('\n');
  if (!bullets || !bullets.length) return `${preamble}\n_Nessun bullet attivo al momento della generazione._`;
  return `${preamble}\n${renderBulletList(bullets)}`;
}

function syncMarkedFile(absPath, block, checkOnly) {
  const existing = fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : '';
  const wrapped = `${BEGIN_MARKER}\n\n${block}\n\n${END_MARKER}`;

  let next;
  const beginIdx = existing.indexOf(BEGIN_MARKER);
  const endIdx = existing.indexOf(END_MARKER);
  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    next = existing.slice(0, beginIdx) + wrapped + existing.slice(endIdx + END_MARKER.length);
  } else if (existing.trim() === '') {
    next = `${wrapped}\n`;
  } else {
    next = `${existing.replace(/\s+$/, '')}\n\n${wrapped}\n`;
  }

  const changed = next !== existing;
  if (checkOnly) return changed;
  if (changed) {
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, next);
  }
  return changed;
}

function instructionsPathFor(scopeKey) {
  const name = scopeKey.startsWith('family:') ? `ace-family-${scopeKey.slice(7)}` : `ace-${scopeKey}`;
  return path.join(REPO_ROOT, '.github', 'instructions', `${name}.instructions.md`);
}

// Riutilizzabile da altri script (es. apply_delta.js, che la incatena in
// automatico dopo aver scritto i playbook, per non lasciare mai i file
// generati disallineati in attesa di un run manuale).
function run({ checkOnly = false, verbose = true } = {}) {
  const { byScope, excluded } = collectBullets();

  const totalIncluded = [...byScope.values()].reduce((n, arr) => n + arr.length, 0);
  if (verbose) {
    console.log(`Bullet inclusi: ${totalIncluded}`);
    if (excluded.length) {
      console.log('Bullet esclusi:');
      for (const e of excluded) console.log(`  - [${e.id}] (${e.scope}): ${e.reason}`);
    }
  }

  const changedFiles = [];

  const globalPath = path.join(REPO_ROOT, '.github', 'copilot-instructions.md');
  const globalChanged = syncMarkedFile(globalPath, renderGlobalBlock(byScope.get('_global')), checkOnly);
  if (globalChanged) changedFiles.push(path.relative(REPO_ROOT, globalPath));

  const agentAndFamilyKeys = [
    ...AGENT_SCOPES,
    ...[...byScope.keys()].filter((k) => k.startsWith('family:')),
  ];
  for (const scopeKey of agentAndFamilyKeys) {
    const bullets = byScope.get(scopeKey) || [];
    const targetPath = instructionsPathFor(scopeKey);
    const changed = syncMarkedFile(targetPath, renderAgentBlock(scopeKey, bullets), checkOnly);
    if (changed) changedFiles.push(path.relative(REPO_ROOT, targetPath));
  }

  if (verbose) {
    if (checkOnly) {
      console.log(changedFiles.length
        ? `File che cambierebbero (--check, nessuna scrittura eseguita): ${changedFiles.map((f) => f.replace(/\\/g, '/')).join(', ')}`
        : 'Nessuna modifica necessaria.');
    } else {
      console.log(changedFiles.length
        ? `Sincronizzati: ${changedFiles.map((f) => f.replace(/\\/g, '/')).join(', ')}`
        : 'Nessuna modifica necessaria.');
    }
  }

  return changedFiles;
}

module.exports = { run };

if (require.main === module) {
  run({ checkOnly: process.argv.includes('--check') });
}

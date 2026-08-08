#!/usr/bin/env node
'use strict';

// Traduce deterministicamente gli asset AI da GitHub Copilot a Claude Code:
// - .github/agents/*.agent.md          -> .claude/agents/<name>.md
// - .github/copilot-instructions.md    -> CLAUDE.md (sync marker-based)
// - .github/instructions/*.instructions.md -> NIENTE. Sono già referenziati
//   esplicitamente via read_file dal corpo di ciascun agente (percorso
//   riscritto insieme al resto dei link): nessuna copia o trasformazione
//   separata serve.
//
// Salva nel blocco ASSET-SYNC (vedi lib/asset_sync_meta.js) tutto ciò che
// serve a claude-to-copilot.js per un round-trip senza perdita: nome file
// originale, tool/model esatti pre-traduzione, campi Copilot senza
// equivalente Claude (agents/user-invocable/argument-hint).
//
// Uso:
//   node scripts/copilot-to-claude.js [--check]

const fs = require('fs');
const path = require('path');
const { rewriteLinks } = require('./lib/rewrite_links');
const { rewriteToolMentions } = require('./lib/rewrite_tool_mentions');
const { stripMeta, buildMeta } = require('./lib/asset_sync_meta');
const {
  COPILOT_TO_CLAUDE_TOOL, COPILOT_TO_CLAUDE_MODEL,
  COPILOT_MODEL_CODENAME_TO_CLAUDE, CLAUDE_ONLY_EXTRA_TOOLS,
} = require('./lib/dictionaries');

const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCE_AGENTS_DIR = path.join(REPO_ROOT, '.github', 'agents');
const TARGET_AGENTS_DIR = path.join(REPO_ROOT, '.claude', 'agents');
const COPILOT_INSTRUCTIONS = path.join(REPO_ROOT, '.github', 'copilot-instructions.md');
const CLAUDE_MD = path.join(REPO_ROOT, 'CLAUDE.md');

// I file ACE-*.agent.md sono copie letterali (cp, via GitHub Action) di
// ace/prompts/*.md: il loro corpo contiene link relativi scritti pensando
// a quella sorgente, non alla loro posizione fisica in .github/agents/.
// Per risolverli correttamente in fase di traduzione (senza toccare la
// action, che resta cp puro) serve sapere qual è la directory "logica" di
// origine di ciascun file, non quella fisica.
const LOGICAL_SOURCE_DIR_OVERRIDES = {
  'ACE-reflector.agent.md': path.join(REPO_ROOT, 'ace', 'prompts'),
  'ACE-curator.agent.md': path.join(REPO_ROOT, 'ace', 'prompts'),
  'ACE-warden.agent.md': path.join(REPO_ROOT, 'ace', 'prompts'),
};

const MODEL_FALLBACK = 'inherit';

function stripQuotes(s) {
  return s.replace(/^"|"$/g, '');
}

function parseFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw);
  if (!m) throw new Error('Frontmatter non trovato o malformato');
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { fm, body: m[2] };
}

function parseBracketList(value) {
  const inner = value.replace(/^\[/, '').replace(/\]$/, '');
  if (!inner.trim()) return [];
  return inner.split(',').map((s) => s.trim()).filter(Boolean);
}

function translateTools(rawValue, warnings) {
  const original = parseBracketList(rawValue);
  const translated = [];
  const seen = new Set();
  const dropped = [];
  for (const tool of original) {
    const mapped = COPILOT_TO_CLAUDE_TOOL[tool];
    if (!mapped) { dropped.push(tool); continue; }
    if (!seen.has(mapped)) { seen.add(mapped); translated.push(mapped); }
  }
  if (dropped.length) warnings.push(`tool Copilot non mappati, scartati: ${dropped.join(', ')}`);
  return translated;
}

function translateModel(rawValue, warnings) {
  const clean = stripQuotes(rawValue);
  const mapped = COPILOT_TO_CLAUDE_MODEL[clean];
  if (mapped) return mapped;
  const codename = clean.trim().split(/\s+/).pop();
  const byCodename = COPILOT_MODEL_CODENAME_TO_CLAUDE[codename];
  if (byCodename) return byCodename;
  warnings.push(`model "${clean}" non traducibile 1:1 -> fallback "${MODEL_FALLBACK}" (originale preservato nei metadati per il round-trip)`);
  return MODEL_FALLBACK;
}

function translateAgentFile(fileName) {
  const warnings = [];
  const raw = fs.readFileSync(path.join(SOURCE_AGENTS_DIR, fileName), 'utf8');
  const { fm, body } = parseFrontmatter(raw);
  const cleanBody = stripMeta(body); // rimuove un eventuale blocco ASSET-SYNC di un round-trip precedente

  const name = fileName.replace(/\.agent\.md$/, '').toLowerCase();
  const description = fm.description ? stripQuotes(fm.description) : '';
  const model = fm.model ? translateModel(fm.model, warnings) : MODEL_FALLBACK;
  const tools = fm.tools ? translateTools(fm.tools, warnings) : [];
  for (const extra of CLAUDE_ONLY_EXTRA_TOOLS[fileName] || []) {
    if (!tools.includes(extra)) tools.push(extra);
  }

  const meta = buildMeta([
    ['source', `.github/agents/${fileName}`],
    ['original-tools', fm.tools || null],
    ['original-model', fm.model ? stripQuotes(fm.model) : null],
    ['agents-passthrough', fm.agents || null],
    ['user-invocable-passthrough', fm['user-invocable'] || null],
    ['argument-hint-passthrough', fm['argument-hint'] || null],
  ]);

  const logicalSourceDir = LOGICAL_SOURCE_DIR_OVERRIDES[fileName] || SOURCE_AGENTS_DIR;
  const linkedBody = rewriteLinks(cleanBody, logicalSourceDir, TARGET_AGENTS_DIR).replace(/^\r?\n+/, '');
  const rewrittenBody = rewriteToolMentions(linkedBody, COPILOT_TO_CLAUDE_TOOL);

  const fmLines = ['---', `name: ${name}`, `description: ${JSON.stringify(description)}`];
  if (tools.length) fmLines.push(`tools: ${tools.join(', ')}`);
  fmLines.push(`model: ${model}`, '---', '');

  let out = fmLines.join('\n');
  out += meta;
  out += rewrittenBody;
  if (!out.endsWith('\n')) out += '\n';

  return { name, content: out, warnings };
}

const CLAUDE_BEGIN = '<!-- CLAUDE:BEGIN — generato da scripts/copilot-to-claude.js da .github/copilot-instructions.md, non modificare a mano tra questi marker -->';
const CLAUDE_END = '<!-- CLAUDE:END -->';

function syncClaudeMd(globalBlock, checkOnly) {
  const existing = fs.existsSync(CLAUDE_MD) ? fs.readFileSync(CLAUDE_MD, 'utf8') : '';
  const wrapped = `${CLAUDE_BEGIN}\n\n${globalBlock.trim()}\n\n${CLAUDE_END}`;

  let next;
  const bi = existing.indexOf(CLAUDE_BEGIN);
  const ei = existing.indexOf(CLAUDE_END);
  if (bi !== -1 && ei !== -1 && ei > bi) {
    next = existing.slice(0, bi) + wrapped + existing.slice(ei + CLAUDE_END.length);
  } else if (existing.trim() === '') {
    next = `${wrapped}\n`;
  } else {
    next = `${existing.replace(/\s+$/, '')}\n\n${wrapped}\n`;
  }

  const changed = next !== existing;
  if (changed && !checkOnly) fs.writeFileSync(CLAUDE_MD, next);
  return changed;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  if (!checkOnly) fs.mkdirSync(TARGET_AGENTS_DIR, { recursive: true });

  const agentFiles = fs.readdirSync(SOURCE_AGENTS_DIR).filter((f) => f.endsWith('.agent.md'));
  const results = [];
  for (const fileName of agentFiles) {
    const { name, content, warnings } = translateAgentFile(fileName);
    const outPath = path.join(TARGET_AGENTS_DIR, `${name}.md`);
    if (!checkOnly) fs.writeFileSync(outPath, content);
    results.push({ fileName, outPath: path.relative(REPO_ROOT, outPath).replace(/\\/g, '/'), warnings });
  }

  const globalRaw = fs.existsSync(COPILOT_INSTRUCTIONS) ? fs.readFileSync(COPILOT_INSTRUCTIONS, 'utf8') : '';
  const claudeChanged = syncClaudeMd(globalRaw, checkOnly);

  for (const r of results) {
    console.log(`${r.fileName} -> ${r.outPath}`);
    for (const w of r.warnings) console.log(`  ATTENZIONE: ${w}`);
  }
  console.log('.github/instructions/*.instructions.md -> (nessuna traduzione: già referenziati via read_file nel corpo di ciascun agente)');
  console.log(checkOnly
    ? '(--check, nessuna scrittura eseguita)'
    : `CLAUDE.md ${claudeChanged ? 'aggiornato' : 'invariato'}.`);
}

main();

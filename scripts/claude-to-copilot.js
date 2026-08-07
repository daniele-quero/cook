#!/usr/bin/env node
'use strict';

// Traduce deterministicamente gli asset AI da Claude Code a GitHub Copilot
// (inverso di copilot-to-claude.js):
// - .claude/agents/*.md -> .github/agents/<NomeOriginale>.agent.md
// - CLAUDE.md           -> .github/copilot-instructions.md (sync marker-based)
//
// Usa il blocco ASSET-SYNC (vedi lib/asset_sync_meta.js) per un round-trip
// senza perdita quando presente: nome file originale, tool/model esatti
// pre-traduzione, campi Copilot senza equivalente Claude. In assenza di
// questi metadati (agente nativo Claude, mai stato su Copilot) usa un
// fallback esplicito, sempre segnalato con un warning — mai una
// corrispondenza inventata silenziosamente.
//
// ACE-reflector/curator/warden sono un caso speciale: la loro sorgente di
// verità sul lato Copilot è ace/prompts/*.md (sincronizzata in
// .github/agents/ACE-*.agent.md da .github/workflows/sync-agent-prompts.yml,
// un cp puro, deliberatamente non toccato). Scrivere qui il risultato
// tradotto da .claude/ creerebbe due mecanismi che si contendono lo stesso
// file con contenuti diversi — questo script quindi si FERMA e segnala,
// non scrive, per quei tre file: l'edit va fatto in ace/prompts/.
//
// Uso:
//   node scripts/claude-to-copilot.js [--check]

const fs = require('fs');
const path = require('path');
const { rewriteLinks } = require('./lib/rewrite_links');
const { stripMeta, buildMeta, readMetaField } = require('./lib/asset_sync_meta');
const {
  CLAUDE_TO_COPILOT_PRIMARY_TOOL, CLAUDE_TOOL_COLLAPSES, CLAUDE_TO_COPILOT_MODEL,
} = require('./lib/dictionaries');

const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCE_AGENTS_DIR = path.join(REPO_ROOT, '.claude', 'agents');
const TARGET_AGENTS_DIR = path.join(REPO_ROOT, '.github', 'agents');
const CLAUDE_MD = path.join(REPO_ROOT, 'CLAUDE.md');
const COPILOT_INSTRUCTIONS = path.join(REPO_ROOT, '.github', 'copilot-instructions.md');

// Nomi file (lato Copilot) la cui vera sorgente è ace/prompts/, non
// traducibili da qui senza entrare in conflitto con sync-agent-prompts.yml.
const RESERVED_BY_ACE_SYNC = new Set(['ACE-reflector.agent.md', 'ACE-curator.agent.md', 'ACE-warden.agent.md']);

const MODEL_FALLBACK = 'Claude Sonnet 5';

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

function defaultCopilotName(claudeName) {
  // Fallback per agenti nativi Claude senza metadato "source": Title-Case
  // del primo segmento, resto invariato. Non conosce la convenzione reale
  // (es. "ACE" tutto maiuscolo) — va verificato a mano se il nome non
  // segue lo schema Cook-*/ACE-* già in uso.
  const parts = claudeName.split('-');
  parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return `${parts.join('-')}.agent.md`;
}

function translateTools(rawValue, warnings, originalToolsMeta) {
  if (originalToolsMeta) return originalToolsMeta; // round-trip lossless, testo Copilot originale verbatim
  const claudeTools = rawValue.split(',').map((s) => s.trim()).filter(Boolean);
  const translated = [];
  const seen = new Set();
  const dropped = [];
  for (const tool of claudeTools) {
    const mapped = CLAUDE_TO_COPILOT_PRIMARY_TOOL[tool];
    if (!mapped) { dropped.push(tool); continue; }
    if (!seen.has(mapped)) { seen.add(mapped); translated.push(mapped); }
    if (CLAUDE_TOOL_COLLAPSES[tool]) {
      warnings.push(`tool Claude "${tool}" corrisponde a più tool Copilot collassati (${CLAUDE_TOOL_COLLAPSES[tool].join(', ')}); senza metadati di origine uso solo l'inverso primario "${mapped}"`);
    }
  }
  if (dropped.length) warnings.push(`tool Claude non mappati, scartati: ${dropped.join(', ')}`);
  return `[${translated.join(', ')}]`;
}

function translateModel(claudeModel, warnings, originalModelMeta) {
  if (originalModelMeta) return originalModelMeta; // round-trip lossless
  const mapped = CLAUDE_TO_COPILOT_MODEL[claudeModel];
  if (mapped) return mapped;
  warnings.push(`model Claude "${claudeModel}" senza metadato di origine e senza mappatura -> fallback "${MODEL_FALLBACK}"`);
  return MODEL_FALLBACK;
}

function translateAgentFile(fileName) {
  const warnings = [];
  const raw = fs.readFileSync(path.join(SOURCE_AGENTS_DIR, fileName), 'utf8');
  const { fm, body } = parseFrontmatter(raw);

  const sourceMeta = readMetaField(body, 'source');
  const outName = sourceMeta ? path.basename(sourceMeta) : defaultCopilotName(fm.name || fileName.replace(/\.md$/, ''));

  if (RESERVED_BY_ACE_SYNC.has(outName)) {
    return {
      outName, skipped: true, warnings: [`saltato: "${outName}" è generato da ace/prompts/ via sync-agent-prompts.yml, non da qui — edita ace/prompts/${outName.replace(/^ACE-/, '').replace(/\.agent\.md$/, '.md').toLowerCase()} invece`],
    };
  }
  if (!sourceMeta) warnings.push(`nessun metadato "source": nome file dedotto come "${outName}" (verifica la capitalizzazione a mano, es. ACE- vs Ace-)`);

  const originalToolsMeta = readMetaField(body, 'original-tools');
  const originalModelMeta = readMetaField(body, 'original-model');
  const agentsPassthrough = readMetaField(body, 'agents-passthrough');
  const userInvocablePassthrough = readMetaField(body, 'user-invocable-passthrough');
  const argumentHintPassthrough = readMetaField(body, 'argument-hint-passthrough');

  const description = stripQuotes(fm.description || '');
  const tools = fm.tools ? translateTools(fm.tools, warnings, originalToolsMeta) : null;
  const model = translateModel(fm.model || 'inherit', warnings, originalModelMeta);

  const cleanBody = stripMeta(body);
  const meta = buildMeta([
    ['source', `.claude/agents/${fileName}`],
    ['original-tools-claude', fm.tools || null],
    ['original-model-claude', fm.model || null],
  ]);

  const rewrittenBody = rewriteLinks(cleanBody, SOURCE_AGENTS_DIR, TARGET_AGENTS_DIR).replace(/^\r?\n+/, '');

  const fmLines = ['---', `description: ${JSON.stringify(description)}`, `model: "${model}"`];
  if (tools) fmLines.push(`tools: ${tools}`);
  if (agentsPassthrough) fmLines.push(`agents: ${agentsPassthrough}`);
  if (argumentHintPassthrough) fmLines.push(`argument-hint: ${argumentHintPassthrough}`);
  if (userInvocablePassthrough) fmLines.push(`user-invocable: ${userInvocablePassthrough}`);
  fmLines.push('---', '');

  let out = fmLines.join('\n');
  out += meta;
  out += rewrittenBody;
  if (!out.endsWith('\n')) out += '\n';

  return { outName, content: out, warnings, skipped: false };
}

const COPILOT_BEGIN_PREFIX = '<!-- CLAUDE:BEGIN';
const ACE_BEGIN = '<!-- ACE:BEGIN — generato da ace/scripts/retrieval.js, non modificare a mano tra questi marker -->';
const ACE_END = '<!-- ACE:END -->';

function syncCopilotInstructions(claudeRaw, checkOnly) {
  // CLAUDE.md contiene <!-- CLAUDE:BEGIN --> ... (che a sua volta contiene
  // il blocco <!-- ACE:BEGIN/END --> copiato pari pari da
  // copilot-instructions.md) ... <!-- CLAUDE:END -->. Si estrae il
  // contenuto tra i marker ACE (non quelli CLAUDE, che sono solo
  // dell'involucro lato Claude) e si riscrive nel file Copilot originale,
  // preservando gli stessi marker ACE già usati da retrieval.js.
  const aceStart = claudeRaw.indexOf(ACE_BEGIN);
  const aceEnd = claudeRaw.indexOf(ACE_END);
  if (aceStart === -1 || aceEnd === -1) return { changed: false, warning: 'Nessun blocco ACE trovato in CLAUDE.md: nulla da riportare su copilot-instructions.md.' };
  const aceBlock = claudeRaw.slice(aceStart, aceEnd + ACE_END.length);

  const existing = fs.existsSync(COPILOT_INSTRUCTIONS) ? fs.readFileSync(COPILOT_INSTRUCTIONS, 'utf8') : '';
  let next;
  const bi = existing.indexOf(ACE_BEGIN);
  const ei = existing.indexOf(ACE_END);
  if (bi !== -1 && ei !== -1 && ei > bi) {
    next = existing.slice(0, bi) + aceBlock + existing.slice(ei + ACE_END.length);
  } else if (existing.trim() === '') {
    next = `${aceBlock}\n`;
  } else {
    next = `${existing.replace(/\s+$/, '')}\n\n${aceBlock}\n`;
  }

  const changed = next !== existing;
  if (changed && !checkOnly) fs.writeFileSync(COPILOT_INSTRUCTIONS, next);
  return { changed };
}

function main() {
  const checkOnly = process.argv.includes('--check');
  if (!checkOnly) fs.mkdirSync(TARGET_AGENTS_DIR, { recursive: true });

  const agentFiles = fs.existsSync(SOURCE_AGENTS_DIR)
    ? fs.readdirSync(SOURCE_AGENTS_DIR).filter((f) => f.endsWith('.md'))
    : [];
  const results = [];
  for (const fileName of agentFiles) {
    const r = translateAgentFile(fileName);
    if (!r.skipped && !checkOnly) {
      fs.writeFileSync(path.join(TARGET_AGENTS_DIR, r.outName), r.content);
    }
    results.push({ fileName, ...r });
  }

  const claudeRaw = fs.existsSync(CLAUDE_MD) ? fs.readFileSync(CLAUDE_MD, 'utf8') : '';
  const { changed: copilotChanged, warning: copilotWarning } = syncCopilotInstructions(claudeRaw, checkOnly);

  for (const r of results) {
    console.log(`${r.fileName} -> ${r.skipped ? '(saltato)' : `.github/agents/${r.outName}`}`);
    for (const w of r.warnings) console.log(`  ATTENZIONE: ${w}`);
  }
  if (copilotWarning) console.log(`ATTENZIONE: ${copilotWarning}`);
  console.log(checkOnly
    ? '(--check, nessuna scrittura eseguita)'
    : `.github/copilot-instructions.md ${copilotChanged ? 'aggiornato' : 'invariato'}.`);
}

main();

'use strict';

// Helper condiviso da gate.js e apply_delta.js: legge/scrive i file
// playbooks/*.md nel formato bullet documentato in ogni playbook
// (intestazione HTML "Formato bullet"). Non contiene logica di
// retrieval/injection: solo parsing e serializzazione del formato su disco.

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SCHEMA_PATH = path.join(REPO_ROOT, 'ace', 'schema', 'bullet.schema.json');

function loadBulletSchema() {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
}

function scopeToRelPath(scope) {
  if (!scope || !scope.type) throw new Error('scope.type mancante');
  if (scope.type === 'global') return path.join('playbooks', '_global.md');
  if (scope.type === 'agent') {
    if (!scope.agent) throw new Error("scope.agent mancante per scope.type='agent'");
    return path.join('playbooks', `${scope.agent}.md`);
  }
  if (scope.type === 'family') {
    if (!scope.family) throw new Error("scope.family mancante per scope.type='family'");
    return path.join('playbooks', 'families', `${scope.family}.md`);
  }
  throw new Error(`scope.type sconosciuto: ${scope.type}`);
}

const BULLET_HEADING_RE = /^## (P-\d+) — (active|quarantined|deprecated) — used:(\d+) helped:(\d+) hurt:(\d+)\s*$/;

// Un file playbook è: prefisso (intro/prosa) + zero o più bullet + suffisso
// (il commento HTML "Formato bullet", sempre in fondo, preservato invariato).
function parsePlaybookFile(raw) {
  const lines = raw.split(/\r?\n/);
  const firstBulletIdx = lines.findIndex((l) => BULLET_HEADING_RE.test(l));
  const commentIdx = lines.findIndex((l) => l.trim().startsWith('<!--'));

  const prefixEnd = firstBulletIdx !== -1 ? firstBulletIdx : (commentIdx !== -1 ? commentIdx : lines.length);
  const suffixStart = commentIdx !== -1 && commentIdx >= prefixEnd ? commentIdx : lines.length;

  const prefixLines = lines.slice(0, prefixEnd);
  const bulletLines = lines.slice(prefixEnd, suffixStart);
  const suffixLines = lines.slice(suffixStart);

  const bullets = [];
  let current = null;
  for (const line of bulletLines) {
    const m = BULLET_HEADING_RE.exec(line);
    if (m) {
      if (current) bullets.push(finalizeBullet(current));
      current = {
        id: m[1], status: m[2],
        used: Number(m[3]), helped: Number(m[4]), hurt: Number(m[5]),
        contentLines: [], tags: [], provenance: null,
      };
    } else if (current) {
      const trimmed = line.trim();
      if (trimmed.startsWith('tags:')) {
        current.tags = parseInlineArray(trimmed.slice('tags:'.length).trim());
      } else if (trimmed.startsWith('provenance:')) {
        current.provenance = trimmed.slice('provenance:'.length).trim();
      } else {
        current.contentLines.push(line);
      }
    }
  }
  if (current) bullets.push(finalizeBullet(current));

  return {
    prefix: prefixLines.join('\n'),
    bullets,
    suffix: suffixLines.join('\n'),
  };
}

function finalizeBullet(b) {
  while (b.contentLines.length && b.contentLines[0].trim() === '') b.contentLines.shift();
  while (b.contentLines.length && b.contentLines[b.contentLines.length - 1].trim() === '') b.contentLines.pop();
  b.content = b.contentLines.join('\n');
  delete b.contentLines;
  return b;
}

function parseInlineArray(inner) {
  const m = /^\[(.*)\]$/.exec(inner);
  if (!m || !m[1].trim()) return [];
  return m[1].split(',').map((s) => s.trim()).filter(Boolean);
}

function bulletToMarkdown(b) {
  const heading = `## ${b.id} — ${b.status} — used:${b.used} helped:${b.helped} hurt:${b.hurt}`;
  const tagsLine = `tags: [${(b.tags || []).join(', ')}]`;
  const provenanceLine = `provenance: ${b.provenance || ''}`;
  return [heading, '', b.content, '', tagsLine, provenanceLine].join('\n');
}

// Rimuove il paragrafo placeholder "vuoto per ora / il playbook parte
// vuoto" quando si aggiunge il primo bullet reale a un file.
function stripEmptyPlaceholder(prefix) {
  const lines = prefix.split('\n');
  const idx = lines.findIndex((l) => l.includes('nessun bullet reale'));
  if (idx === -1) return prefix;
  let end = idx;
  while (end + 1 < lines.length && lines[end + 1].trim() !== '') end += 1;
  lines.splice(idx, end - idx + 1);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

function serializeFile(prefix, bullets, suffix) {
  const trimmedPrefix = prefix.replace(/\s+$/, '');
  const bulletsBlock = bullets.map(bulletToMarkdown).join('\n\n');
  const trimmedSuffix = (suffix || '').replace(/^\s+/, '');
  const sections = [trimmedPrefix];
  if (bulletsBlock) sections.push(bulletsBlock);
  if (trimmedSuffix) sections.push(trimmedSuffix);
  return `${sections.join('\n\n')}\n`;
}

function listPlaybookFiles() {
  const dir = path.join(REPO_ROOT, 'playbooks');
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md')) result.push(path.join('playbooks', entry.name));
  }
  const familiesDir = path.join(dir, 'families');
  if (fs.existsSync(familiesDir)) {
    for (const f of fs.readdirSync(familiesDir)) {
      if (f.endsWith('.md')) result.push(path.join('playbooks', 'families', f));
    }
  }
  return result;
}

function listArchiveFiles() {
  const dir = path.join(REPO_ROOT, 'playbooks', 'archive');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join('playbooks', 'archive', f));
}

function collectExistingIds() {
  const map = new Map();
  for (const rel of [...listPlaybookFiles(), ...listArchiveFiles()]) {
    const raw = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
    const { bullets } = parsePlaybookFile(raw);
    for (const b of bullets) map.set(b.id, { file: rel, status: b.status });
  }
  return map;
}

module.exports = {
  REPO_ROOT,
  loadBulletSchema,
  scopeToRelPath,
  parsePlaybookFile,
  bulletToMarkdown,
  stripEmptyPlaceholder,
  serializeFile,
  listPlaybookFiles,
  listArchiveFiles,
  collectExistingIds,
};

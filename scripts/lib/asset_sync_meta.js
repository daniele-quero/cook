'use strict';

// Blocco di metadati "ASSET-SYNC" in testa al body (dopo il frontmatter)
// di ogni file tradotto, in entrambe le direzioni. Serve a rendere il
// round-trip senza perdita: preserva ciò che l'altro formato non può
// esprimere nativamente (nome file originale, tool/model esatti
// pre-traduzione, campi Copilot senza equivalente Claude).
//
// Sempre rigenerato da zero (stripMeta prima di buildMeta): un file
// tradotto avanti e indietro più volte non accumula blocchi annidati.

const BEGIN = '<!-- ASSET-SYNC:BEGIN — generato automaticamente, non modificare a mano tra questi marker -->';
const END = '<!-- ASSET-SYNC:END -->';

function stripMeta(body) {
  const trimmed = body.replace(/^\r?\n+/, '');
  if (!trimmed.startsWith(BEGIN)) return body;
  const endIdx = trimmed.indexOf(END);
  if (endIdx === -1) return body;
  return trimmed.slice(endIdx + END.length).replace(/^\r?\n+/, '');
}

// fields: array di [key, value] nell'ordine desiderato. value=null/undefined -> riga omessa.
function buildMeta(fields) {
  const lines = fields.filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (!lines.length) return '';
  const body = lines.map(([k, v]) => `  - ${k}: ${v}`).join('\n');
  return `${BEGIN}\n${body}\n${END}\n\n`;
}

function readMetaField(body, key) {
  const trimmed = body.replace(/^\r?\n+/, '');
  if (!trimmed.startsWith(BEGIN)) return null;
  const endIdx = trimmed.indexOf(END);
  if (endIdx === -1) return null;
  const block = trimmed.slice(0, endIdx);
  const re = new RegExp(`- ${key}: (.+)`);
  const m = re.exec(block);
  return m ? m[1].trim() : null;
}

module.exports = { BEGIN, END, stripMeta, buildMeta, readMetaField };

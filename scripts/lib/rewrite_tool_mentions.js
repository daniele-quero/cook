'use strict';

// Sostituisce le citazioni di nomi tool tra backtick nel corpo markdown
// (es. "usa il tool `execute`") con il loro equivalente nell'altro
// ecosistema, cosi' il testo delle istruzioni resta coerente con la
// lista `tools:` dopo la traduzione (prima veniva tradotto solo il
// frontmatter, lasciando nel corpo nomi tool dell'ecosistema di
// partenza). Sostituisce solo backtick il cui contenuto e' ESATTAMENTE
// un nome tool noto nel dizionario passato — mai una substring — per non
// toccare altri code span nel testo (es. `git`, `read_file`, `gate.js`).
//
// Stesso limite gia' documentato per il frontmatter in dictionaries.js
// (CLAUDE_TOOL_COLLAPSES): piu' nomi Copilot possono confluire sullo
// stesso nome Claude (es. 'execute' e 'read/terminalLastCommand' ->
// 'Bash'), quindi una traduzione di andata e ritorno del corpo puo'
// perdere la distinzione originale tra i due — accettato, non risolto
// qui.

const TOOL_MENTION_RE = /`([^`\n]+)`/g;

function rewriteToolMentions(markdown, dictionary) {
  return markdown.replace(TOOL_MENTION_RE, (full, name) => {
    const mapped = dictionary[name];
    return mapped ? `\`${mapped}\`` : full;
  });
}

module.exports = { rewriteToolMentions };

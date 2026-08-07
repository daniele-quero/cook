'use strict';

// Dizionari condivisi dai due traduttori (copilot-to-claude.js e
// claude-to-copilot.js), cosi' restano sempre coerenti tra loro.
//
// I nomi tool lato Copilot qui sotto sono quelli confermati disponibili
// per i custom agent VS Code usati in questo progetto: 'read', 'edit',
// 'search/codebase', 'web/fetch', 'agent', 'read/terminalLastCommand',
// 'execute' ('read' ed 'execute' verificati disponibili nell'ambiente
// VS Code dell'utente, oltre l'elenco emerso dalla sola documentazione
// pubblica — vedi Cook-writer.agent.md e Cook-orchestrator.agent.md).
// Le versioni precedenti di questo
// dizionario usavano nomi inventati (es. 'execute/runInTerminal',
// 'read/readFile', 'vscode/askQuestions') che non corrispondevano a
// nessun tool reale — VS Code li ignora silenziosamente se non
// riconosciuti, quindi non causavano un errore visibile, solo una
// perdita silenziosa di capacità.
//
// AskUserQuestion (Claude) non ha un vero equivalente Copilot: un
// custom agent Copilot pone la domanda direttamente in chat, senza
// bisogno di un tool dedicato.
//
// Il dizionario tool NON è biiettivo: più chiavi Claude confluiscono
// sullo stesso tool Copilot 'edit' (Read/Write/Edit). CLAUDE_TO_COPILOT_PRIMARY_TOOL
// è quindi un inverso "primario", non un vero inverso 1:1 — è un limite
// intrinseco, mitigato da asset_sync_meta.js che preserva la lista
// Copilot originale per i file già tradotti almeno una volta (round-trip
// senza perdita), lasciando il fallback lossy solo per agenti nativi
// Claude senza storia Copilot.

const COPILOT_TO_CLAUDE_TOOL = {
  read: 'Read',
  edit: 'Edit',
  'search/codebase': 'Glob',
  'read/terminalLastCommand': 'Bash',
  execute: 'Bash',
  agent: 'Agent',
  'web/fetch': 'WebFetch',
};

const CLAUDE_TO_COPILOT_PRIMARY_TOOL = {
  Read: 'read',
  Write: 'edit',
  Edit: 'edit',
  Glob: 'search/codebase',
  Bash: 'execute',
  Agent: 'agent',
  WebFetch: 'web/fetch',
  // AskUserQuestion: nessun mapping — un custom agent Copilot pone la
  // domanda direttamente in chat, non serve un tool dedicato. Va
  // scartato in traduzione (vedi warning "tool Claude non mappati").
};

// Quali tool Copilot confluiscono in ciascun tool Claude, per il
// warning di traduzione inversa quando manca il metadato original-tools.
const CLAUDE_TOOL_COLLAPSES = {
  Write: ['edit'],
  Edit: ['edit'],
  Bash: ['read/terminalLastCommand', 'execute'],
};

const COPILOT_TO_CLAUDE_MODEL = {
  'Claude Sonnet 5': 'sonnet',
  'Claude Opus 5': 'opus',
  'Claude Haiku 4.5': 'haiku',
};

const CLAUDE_TO_COPILOT_MODEL = {
  sonnet: 'Claude Sonnet 5',
  opus: 'Claude Opus 5',
  haiku: 'Claude Haiku 4.5',
  // "inherit" non ha un equivalente Copilot univoco: gestito dal
  // chiamante con il metadato original-model quando disponibile,
  // altrimenti un fallback esplicito (non deciso qui).
};

module.exports = {
  COPILOT_TO_CLAUDE_TOOL,
  CLAUDE_TO_COPILOT_PRIMARY_TOOL,
  CLAUDE_TOOL_COLLAPSES,
  COPILOT_TO_CLAUDE_MODEL,
  CLAUDE_TO_COPILOT_MODEL,
};

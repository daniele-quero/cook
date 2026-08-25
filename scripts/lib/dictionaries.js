'use strict';

// Dizionari legacy condivisi dai vecchi traduttori. Gli entry point attuali
// usano scripts/agent-registry.json e sync-agent-wrappers.js, ma questi
// mapping restano completi per eventuali consumer esterni.
//
// I mapping includono sia gli alias dell'Agent Host VS Code (view, bash,
// powershell, list_*, read_*, stop_*, write_*, apply_patch, create, edit,
// glob, grep, rg, ask_user, web_fetch) sia gli alias Copilot precedenti.
// Più alias possono convergere sullo stesso tool Claude: la conversione
// inversa resta quindi una rappresentazione primaria, non un round-trip
// perfetto. Il generatore canonico non usa sostituzioni testuali.
//
// Il dizionario tool NON è biiettivo: più chiavi Claude confluiscono
// sullo stesso tool Copilot 'edit' (Read/Write/Edit). CLAUDE_TO_COPILOT_PRIMARY_TOOL
// è quindi un inverso "primario", non un vero inverso 1:1 — è un limite
// intrinseco, mitigato da asset_sync_meta.js che preserva la lista
// Copilot originale per i file già tradotti almeno una volta (round-trip
// senza perdita), lasciando il fallback lossy solo per agenti nativi
// Claude senza storia Copilot.

const COPILOT_TO_CLAUDE_TOOL = {
  bash: 'Bash',
  powershell: 'Bash',
  list_bash: 'Bash',
  list_powershell: 'Bash',
  read_bash: 'Bash',
  read_powershell: 'Bash',
  stop_bash: 'Bash',
  stop_powershell: 'Bash',
  write_bash: 'Bash',
  write_powershell: 'Bash',
  view: 'Read',
  read: 'Read',
  write: 'Write',
  edit: 'Edit',
  apply_patch: 'Edit',
  create: 'Write',
  glob: 'Glob',
  grep: 'Grep',
  rg: 'Grep',
  search: 'Glob',
  'search/codebase': 'Glob',
  'read/terminalLastCommand': 'Bash',
  execute: 'Bash',
  agent: 'Agent',
  task: 'Agent',
  list_agents: 'Agent',
  read_agent: 'Agent',
  skill: 'Skill',
  web_fetch: 'WebFetch',
  'web/fetch': 'WebFetch',
  ask_user: 'AskUserQuestion',
  'vscode/askQuestions': 'AskUserQuestion',
};

const CLAUDE_TO_COPILOT_PRIMARY_TOOL = {
  Read: 'read',
  Write: 'write',
  Edit: 'edit',
  Glob: 'glob',
  Grep: 'grep',
  Bash: 'execute',
  Agent: 'agent',
  Skill: 'skill',
  WebFetch: 'web/fetch',
  AskUserQuestion: 'vscode/askQuestions',
};

// Quali tool Copilot confluiscono in ciascun tool Claude, per il
// warning di traduzione inversa quando manca il metadato original-tools.
const CLAUDE_TOOL_COLLAPSES = {
  Read: ['view', 'read'],
  Write: ['write', 'create'],
  Edit: ['edit', 'apply_patch'],
  Glob: ['glob', 'search', 'search/codebase'],
  Grep: ['grep', 'rg'],
  Bash: [
    'bash',
    'powershell',
    'list_bash',
    'list_powershell',
    'read_bash',
    'read_powershell',
    'stop_bash',
    'stop_powershell',
    'write_bash',
    'write_powershell',
    'read/terminalLastCommand',
    'execute',
  ],
  Agent: ['agent', 'task', 'list_agents', 'read_agent'],
  Skill: ['skill'],
  WebFetch: ['web_fetch', 'web/fetch'],
  AskUserQuestion: ['ask_user', 'vscode/askQuestions'],
};

const COPILOT_TO_CLAUDE_MODEL = {
  'Claude Sonnet 5': 'sonnet',
  'Claude Opus 5': 'opus',
  'Claude Haiku 4.5': 'haiku',
};

// Alcuni agenti Copilot girano su un modello non-Claude (es. GPT, per un
// ruolo dove conviene un provider diverso) con un codename finale che
// indica comunque il livello di capacità equivalente lato Claude —
// convenzione del progetto, non un campo Copilot standard: 'Luna' =
// leggero (haiku), 'Terra' = bilanciato (sonnet), 'Sol' = potente (opus).
// Es. "GPT-5.6 Luna" -> 'haiku'. Usata solo come fallback quando il nome
// esatto non è in COPILOT_TO_CLAUDE_MODEL sopra (che resta prioritaria per
// i nomi Claude-nativi tipo "Claude Sonnet 5").
const COPILOT_MODEL_CODENAME_TO_CLAUDE = {
  Luna: 'haiku',
  Terra: 'sonnet',
  Sol: 'opus',
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
  COPILOT_MODEL_CODENAME_TO_CLAUDE,
};

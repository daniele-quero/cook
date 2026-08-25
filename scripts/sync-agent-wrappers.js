#!/usr/bin/env node
'use strict';

// Generatore canonico dei wrapper Copilot e Claude. Il comportamento vive
// nelle personas operative o nei prompt ACE; questo file istanzia soltanto
// metadati runtime, riferimenti, guardrail e ciclo minimo.

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(__dirname, 'agent-registry.json');
const NAME_RE = /^(gh|cl)\/[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/;
const SCOPES = new Set(['all', 'operational', 'ace']);

const PLATFORM_CONFIG = {
  copilot: {
    prefix: 'gh',
    directory: '.github/agents',
    extension: '.agent.md',
    readInstruction: 'usa `view` nell\'Agent Host VS Code oppure `read` nei runtime Copilot compatibili',
    instructionReadTool: '`view`/`read`',
    interactiveTools: '`vscode/askQuestions` (alias compatibile: `ask_user`)',
  },
  claude: {
    prefix: 'cl',
    directory: '.claude/agents',
    extension: '.md',
    readInstruction: 'usa `Read`',
    instructionReadTool: '`Read`',
    interactiveTools: '`AskUserQuestion`',
  },
};

function readRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function relPath(value) {
  return value.replace(/\\/g, '/');
}

function absoluteRepoPath(relativePath) {
  return path.join(REPO_ROOT, ...relativePath.split('/'));
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function selectedEntries(registry, scope) {
  ensure(SCOPES.has(scope), `Scope non valido: ${scope}. Usa all, operational o ace.`);
  return registry.agents.filter((agent) => scope === 'all' || agent.kind === scope);
}

function expectedWrapperPath(agent, platform) {
  const config = PLATFORM_CONFIG[platform];
  return path.join(REPO_ROOT, ...config.directory.split('/'), agent[platform].file);
}

function validatePlatformConfig(agent, platform, knownIds) {
  const config = agent[platform];
  ensure(config && typeof config === 'object', `${agent.id}: configurazione ${platform} mancante.`);
  ensure(typeof config.file === 'string' && config.file.length > 0, `${agent.id}/${platform}: file mancante.`);
  ensure(!config.file.includes('/') && !config.file.includes('\\'), `${agent.id}/${platform}: file non può contenere directory.`);
  ensure(config.file.endsWith(PLATFORM_CONFIG[platform].extension), `${agent.id}/${platform}: estensione file non valida.`);
  ensure(config.name === `${PLATFORM_CONFIG[platform].prefix}/${agent.team}/${agent.role}`,
    `${agent.id}/${platform}: name deve essere ${PLATFORM_CONFIG[platform].prefix}/${agent.team}/${agent.role}.`);
  ensure(NAME_RE.test(config.name), `${agent.id}/${platform}: name non segue platform/team/role.`);
  ensure(Array.isArray(config.tools) && config.tools.length > 0, `${agent.id}/${platform}: tools mancante o vuoto.`);
  ensure(new Set(config.tools).size === config.tools.length, `${agent.id}/${platform}: tool duplicati.`);
  ensure(config.tools.every((tool) => typeof tool === 'string' && tool.length > 0),
    `${agent.id}/${platform}: tool non valido.`);
  ensure(config.model === null || typeof config.model === 'string',
    `${agent.id}/${platform}: model deve essere stringa o null.`);
  ensure(config.user_invocable === null || typeof config.user_invocable === 'boolean',
    `${agent.id}/${platform}: user_invocable deve essere booleano o null.`);
  if (config.argument_hint !== undefined) {
    ensure(typeof config.argument_hint === 'string', `${agent.id}/${platform}: argument_hint non valido.`);
  }
  const expectedDelegates = agent.delegates || [];
  ensure(expectedDelegates.every((id) => knownIds.has(id)),
    `${agent.id}: delega a un agente inesistente.`);
}

function validateRegistry(registry, scope = 'all') {
  ensure(registry && registry.version === 1, 'Versione del registro agenti non supportata.');
  ensure(Array.isArray(registry.agents) && registry.agents.length > 0, 'Il registro agenti è vuoto o malformato.');

  const ids = new Set();
  const knownIds = new Set(registry.agents.map((agent) => agent.id));
  const names = { copilot: new Set(), claude: new Set() };
  const files = { copilot: new Set(), claude: new Set() };

  for (const agent of registry.agents) {
    ensure(typeof agent.id === 'string' && agent.id.length > 0, 'Agente senza id.');
    ensure(!ids.has(agent.id), `Id agente duplicato: ${agent.id}.`);
    ids.add(agent.id);
    ensure(agent.kind === 'operational' || agent.kind === 'ace', `${agent.id}: kind non valido.`);
    ensure(typeof agent.team === 'string' && typeof agent.role === 'string',
      `${agent.id}: team o role mancante.`);
    ensure(typeof agent.description === 'string' && agent.description.trim(), `${agent.id}: description mancante.`);
    ensure(typeof agent.cycle === 'string' && agent.cycle.trim(), `${agent.id}: cycle mancante.`);
    ensure(Array.isArray(agent.delegates), `${agent.id}: delegates deve essere un array.`);
    ensure(new Set(agent.delegates).size === agent.delegates.length, `${agent.id}: deleghe duplicate.`);
    ensure(Array.isArray(agent.guardrails) && agent.guardrails.length > 0, `${agent.id}: guardrails mancanti.`);

    if (agent.kind === 'operational') {
      ensure(typeof agent.persona === 'string', `${agent.id}: persona mancante.`);
      ensure(fs.existsSync(absoluteRepoPath(agent.persona)), `${agent.id}: persona non trovata: ${agent.persona}.`);
      ensure(agent.ace_instruction === null || typeof agent.ace_instruction === 'string',
        `${agent.id}: ace_instruction non valido.`);
      if (agent.ace_instruction !== null) {
        ensure(fs.existsSync(absoluteRepoPath(agent.ace_instruction)),
          `${agent.id}: istruzioni ACE non trovate: ${agent.ace_instruction}.`);
      }
    } else {
      ensure(typeof agent.source === 'string', `${agent.id}: sorgente ACE mancante.`);
      ensure(fs.existsSync(absoluteRepoPath(agent.source)), `${agent.id}: prompt ACE non trovato: ${agent.source}.`);
    }

    for (const platform of Object.keys(PLATFORM_CONFIG)) {
      validatePlatformConfig(agent, platform, knownIds);
      const platformAgent = agent[platform];
      ensure(!names[platform].has(platformAgent.name), `Nome ${platform} duplicato: ${platformAgent.name}.`);
      ensure(!files[platform].has(platformAgent.file), `File ${platform} duplicato: ${platformAgent.file}.`);
      names[platform].add(platformAgent.name);
      files[platform].add(platformAgent.file);
    }
  }

  for (const agent of registry.agents) {
    for (const delegate of agent.delegates) {
      ensure(ids.has(delegate), `${agent.id}: delega a ${delegate}, ma l'id non esiste.`);
    }
    const copilotInteractive = agent.copilot.tools.some((tool) => tool === 'vscode/askQuestions' || tool === 'ask_user');
    const claudeInteractive = agent.claude.tools.includes('AskUserQuestion');
    ensure(copilotInteractive === claudeInteractive,
      `${agent.id}: tool interattivo non coerente tra Copilot e Claude.`);
  }

  const selected = selectedEntries(registry, scope);
  for (const platform of Object.keys(PLATFORM_CONFIG)) {
    const expected = new Set(selected.map((agent) => agent[platform].file));
    const directory = absoluteRepoPath(PLATFORM_CONFIG[platform].directory);
    if (!fs.existsSync(directory)) continue;
    const extension = PLATFORM_CONFIG[platform].extension;
    const actual = new Set(fs.readdirSync(directory)
      .filter((file) => file.endsWith(extension)));
    if (scope === 'all') {
      for (const file of actual) ensure(expected.has(file), `Wrapper ${platform} non registrato: ${file}.`);
      for (const file of expected) ensure(actual.has(file), `Wrapper ${platform} mancante: ${file}.`);
    }
  }

  return selected;
}

function markdownLink(targetPath, absoluteTarget) {
  let relative = relPath(path.relative(path.dirname(targetPath), absoluteTarget));
  if (!relative.startsWith('.')) relative = `./${relative}`;
  return relative;
}

function renderWrapper(agent, platform, byId) {
  const config = agent[platform];
  const platformConfig = PLATFORM_CONFIG[platform];
  const targetPath = expectedWrapperPath(agent, platform);
  const sourceRelative = agent.kind === 'operational' ? agent.persona : agent.source;
  const sourceLink = markdownLink(targetPath, absoluteRepoPath(sourceRelative));
  const instructionLink = agent.kind === 'operational' && agent.ace_instruction
    ? markdownLink(targetPath, absoluteRepoPath(agent.ace_instruction))
    : sourceLink;
  const delegates = agent.delegates.map((id) => byId.get(id)[platform].name);

  const frontmatter = [
    '---',
    `name: ${config.name}`,
    `description: ${JSON.stringify(agent.description)}`,
  ];
  if (config.model !== null) frontmatter.push(`model: ${JSON.stringify(config.model)}`);
  frontmatter.push(`tools: [${config.tools.join(', ')}]`);
  if (delegates.length) frontmatter.push(`agents: [${delegates.join(', ')}]`);
  if (config.user_invocable !== null) frontmatter.push(`user-invocable: ${config.user_invocable}`);
  if (config.argument_hint !== undefined) frontmatter.push(`argument-hint: ${JSON.stringify(config.argument_hint)}`);
  frontmatter.push('---', '');

  const lines = [
    `<!-- Wrapper generato da scripts/sync-agent-wrappers.js; non modificare qui il comportamento. -->`,
    '',
    agent.kind === 'operational'
      ? `- Persona del ruolo (sorgente di verità): [${sourceRelative}](${sourceLink}). Prima di agire, ${platformConfig.readInstruction} sul file completo.`
      : `- Prompt ACE (sorgente di verità separata dalle personas operative): [${sourceRelative}](${sourceLink}). Prima di agire, ${platformConfig.readInstruction} sul prompt completo.`,
    agent.kind === 'operational' && agent.ace_instruction
      ? `- Istruzioni ACE del ruolo: [${agent.ace_instruction}](${instructionLink}). Leggile con ${platformConfig.instructionReadTool}; se non sono raggiungibili, fermati e segnala il blocco.`
      : agent.kind === 'operational'
        ? '- Istruzioni ACE del ruolo: nessuna; questo ruolo è escluso dal ciclo ACE. Non leggere o modificare playbook e istruzioni ACE.'
      : `- Il prompt ACE contiene il workflow, il formato di output e i gate del ruolo; non duplicarli né sostituirli in questo wrapper.`,
    `- Tool interattivo, quando previsto: ${platformConfig.interactiveTools}. Non sostituire una domanda richiesta dalla persona con testo libero.`,
    '',
    '## Guardrail non delegabili',
    ...agent.guardrails.map((guardrail) => `- ${guardrail}`),
    '',
    '## Ciclo minimo',
    `1. ${agent.cycle}`,
    `2. Segui il contratto completo della sorgente sopra indicata e usa solo le deleghe dichiarate${delegates.length ? ` (${delegates.join(', ')})` : ''}.`,
    `3. Riporta l'esito reale, gli eventuali blocchi e le verifiche eseguite; non simulare tool o risultati.`,
    '',
  ];
  return frontmatter.join('\n') + lines.join('\n');
}

function writeOrCheck(targetPath, content, checkOnly) {
  const existing = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : null;
  if (existing === content) return false;
  if (!checkOnly) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content);
  }
  return true;
}

function run({ scope = 'all', checkOnly = false, verbose = true } = {}) {
  const registry = readRegistry();
  const selected = validateRegistry(registry, scope);
  const byId = new Map(registry.agents.map((agent) => [agent.id, agent]));
  const changes = [];

  for (const agent of selected) {
    for (const platform of Object.keys(PLATFORM_CONFIG)) {
      const targetPath = expectedWrapperPath(agent, platform);
      if (writeOrCheck(targetPath, renderWrapper(agent, platform, byId), checkOnly)) {
        changes.push(relPath(path.relative(REPO_ROOT, targetPath)));
      }
    }
  }

  if (verbose) {
    if (changes.length) {
      console.log(`${checkOnly ? 'Cambierebbero' : 'Sincronizzati'}: ${changes.join(', ')}`);
    } else {
      console.log('Nessuna modifica necessaria.');
    }
  }
  return { changed: changes.length > 0, changes };
}

function parseArgs(argv) {
  const scopeIndex = argv.indexOf('--scope');
  const scope = scopeIndex === -1 ? 'all' : argv[scopeIndex + 1];
  return { scope, checkOnly: argv.includes('--check') };
}

if (require.main === module) {
  try {
    const result = run(parseArgs(process.argv.slice(2)));
    if (parseArgs(process.argv.slice(2)).checkOnly && result.changed) process.exitCode = 1;
  } catch (error) {
    console.error(`Errore sincronizzazione agenti: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  PLATFORM_CONFIG,
  readRegistry,
  validateRegistry,
  renderWrapper,
  run,
};

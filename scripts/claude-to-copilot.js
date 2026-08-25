#!/usr/bin/env node
'use strict';

// Entry point storico mantenuto per compatibilità. La sorgente canonica è il
// registro e il generatore comune, che produce sempre entrambi i lati.
const { run } = require('./sync-agent-wrappers');

function parseArgs(argv) {
  const scopeIndex = argv.indexOf('--scope');
  return {
    scope: scopeIndex === -1 ? 'all' : argv[scopeIndex + 1],
    checkOnly: argv.includes('--check'),
  };
}

try {
  const args = parseArgs(process.argv.slice(2));
  const result = run(args);
  if (args.checkOnly && result.changed) process.exitCode = 1;
} catch (error) {
  console.error(`Errore sincronizzazione agenti Copilot/Claude: ${error.message}`);
  process.exitCode = 1;
}

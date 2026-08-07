'use strict';

// Riscrive i target dei link markdown [testo](target) quando un
// contenuto si sposta da sourceDirAbs a targetDirAbs. Riscrive i target
// che iniziano con "./" o "../" (link relativi espliciti) E i riferimenti
// "nudi" nella stessa cartella con estensione di file riconoscibile (es.
// `curator.md`, senza `./` davanti — pattern reale usato tra
// reflector/curator/warden). Lascia intatti URL http(s)/mailto, ancore,
// percorsi assoluti e placeholder senza forma di percorso (es. l'esempio
// letterale `[link](path)` nella prosa di Cook-writer.agent.md, che non
// ha estensione e non contiene `://`).

const path = require('path');

const LINK_RE = /\]\(([^)]+)\)/g;
const EXPLICIT_RELATIVE_RE = /^\.\.?\//;
const BARE_SAME_DIR_RE = /^[^:/\s]+\.[a-zA-Z0-9]+$/;

function rewriteLinks(markdown, sourceDirAbs, targetDirAbs) {
  return markdown.replace(LINK_RE, (full, target) => {
    if (!EXPLICIT_RELATIVE_RE.test(target) && !BARE_SAME_DIR_RE.test(target)) return full;
    const resolved = path.resolve(sourceDirAbs, target);
    let rel = path.relative(targetDirAbs, resolved).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return `](${rel})`;
  });
}

module.exports = { rewriteLinks };

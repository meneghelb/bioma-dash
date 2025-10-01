#!/usr/bin/env node
// bin/server.js — ESM, sem "book", sem "optimist"
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// parse --port da CLI (bem simples)
const argPort = (() => {
  const i = process.argv.indexOf('--port');
  if (i >= 0 && process.argv[i + 1]) return Number(process.argv[i + 1]);
  return undefined;
})();

const PORT = Number(process.env.PORT || argPort || 3000);
const HOST = process.env.HOST || '0.0.0.0';

async function loadFactory() {
  // tenta server/index.js primeiro
  try {
    const mod = await import(pathToFileURL(resolve(__dirname, '../server/index.js')).href);
    if (mod?.default) return mod.default;
  } catch (e) {
    // continua para fallback
  }
  // fallback para ../server.js se existir
  try {
    const mod = await import(pathToFileURL(resolve(__dirname, '../server.js')).href);
    if (mod?.default) return mod.default;
    throw new Error('server.js encontrado, mas não exporta default');
  } catch (e) {
    const msg = [
      '❌ Não foi possível carregar o módulo do servidor.',
      'Tentado: ../server/index.js e ../server.js',
      `Erros: ${e?.message || e}`
    ].join('\n');
    console.error(msg);
    process.exit(1);
  }
}

const createServer = await loadFactory();
const server = createServer({});
server.listen(PORT, HOST, () => {
  console.log(`✅ bioma-dash escutando em http://${HOST}:${PORT}`);
});

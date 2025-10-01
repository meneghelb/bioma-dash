#!/usr/bin/env node
// Node 20 + ESM, sem 'esm' loader externo

// ---- logger (usa 'debug' se disponível, senão console) ----
let debug = (...args) => console.log('[localtunnel]', ...args);
try {
  const dbg = (await import('debug')).default;
  debug = dbg('localtunnel');
} catch { /* ok sem debug */ }

// ---- parse simples de argumentos (--port --address --secure --domain --max-sockets) ----
const hasFlag = (name) => process.argv.includes(`--${name}`);
const getArg  = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return (i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--'))
    ? process.argv[i + 1]
    : def;
};

const opts = {
  secure: hasFlag('secure'),
  port: parseInt(getArg('port', process.env.PORT || '80'), 10),
  address: getArg('address', '0.0.0.0'),
  domain: getArg('domain', undefined),
  max_tcp_sockets: parseInt(getArg('max-sockets', '10'), 10),
};

if (hasFlag('help')) {
  console.log(`
Usage: node bin/server.js [--port <num>] [--address <ip>] [--secure] [--domain <base>]
                          [--max-sockets <num>]

Env:   PORT (prioridade se --port não for passado)
Default: --port ${process.env.PORT || 80} --address 0.0.0.0 --max-sockets 10
`);
  process.exit(0);
}

// ---- carrega CreateServer (tenta ../server/index.js e depois ../server.js) ----
let CreateServer;
try {
  const mod = await import(new URL('../server/index.js', import.meta.url));
  CreateServer = mod.default ?? mod.CreateServer ?? mod;
} catch (e1) {
  try {
    const mod = await import(new URL('../server.js', import.meta.url));
    CreateServer = mod.default ?? mod.CreateServer ?? mod;
  } catch (e2) {
    console.error('❌ Não foi possível carregar o módulo do servidor.');
    console.error('Tentado: ../server/index.js e ../server.js');
    console.error('Erros:', e1?.message || e1, '||', e2?.message || e2);
    process.exit(1);
  }
}

// ---- sobe o servidor ----
const server = CreateServer({
  max_tcp_sockets: opts.max_tcp_sockets,
  secure: opts.secure,
  domain: opts.domain,
});

server.listen(opts.port, opts.address, () => {
  const p = server.address().port;
  debug(`server listening on port: ${p}`);
  console.log(`✅ listening at http://${opts.address}:${p}`);
});

// ---- sinais & erros ----
const exit = (code=0) => { try { server.close?.(); } catch {} process.exit(code); };
process.on('SIGINT',  () => exit(0));
process.on('SIGTERM', () => exit(0));
process.on('uncaughtException', (err) => { console.error('uncaughtException:', err); });
process.on('unhandledRejection', (reason) => { console.error('unhandledRejection:', reason); });

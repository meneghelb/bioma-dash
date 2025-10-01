// bin/server.js
const http = require('http');
const { createProxyServer } = require('http-proxy');

const PORT = Number(process.env.PORT) || 10000;
const TARGET = process.env.TARGET_URL || process.env.UPSTREAM;

if (!TARGET) {
  console.error('Defina TARGET_URL (ou UPSTREAM) nas variáveis de ambiente!');
  process.exit(1);
}

const proxy = createProxyServer({
  target: TARGET,
  changeOrigin: true,
  secure: true, // Funnel tem HTTPS válido
  ws: true,
});

// Reescreve Location de redirects para manter o domínio do Render
proxy.on('proxyRes', (proxyRes, req, res) => {
  const loc = proxyRes.headers['location'];
  if (loc && loc.startsWith(TARGET)) {
    const publicBase = `https://${req.headers.host}`;
    proxyRes.headers['location'] = loc.replace(TARGET, publicBase);
  }
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (!res.headersSent) res.writeHead(502);
  res.end('Bad gateway');
});

const server = http.createServer((req, res) => {
  proxy.web(req, res);
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ bioma-dash escutando em http://0.0.0.0:${PORT}`);
  console.log(`↪️  Proxy para: ${TARGET}`);
});

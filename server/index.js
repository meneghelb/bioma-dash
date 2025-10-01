// server/index.js (ESM)
import http from 'node:http';
import express from 'express';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';

/**
 * Factory que cria e retorna um http.Server.
 * - Se TARGET_URL estiver definida (ex.: http://seu-alvo:porta), faz proxy.
 * - Senão, serve uma página simples de "online".
 */
export default function createServer(opts = {}) {
  const app = express();
  app.set('trust proxy', true);
  app.use(morgan('tiny'));

  const TARGET = process.env.TARGET_URL; // opcional

  if (TARGET) {
    const proxy = createProxyMiddleware({
      target: TARGET,
      changeOrigin: true,
      ws: true,
      secure: false,
      xfwd: true,
      onError(err, req, res) {
        if (!res.headersSent) {
          res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
        }
        res.end('Bad gateway / proxy error');
      },
      onProxyReq(proxyReq, req) {
        // garante Host/X-Forwarded corretos
        proxyReq.setHeader('X-Forwarded-Proto', req.protocol || 'http');
      },
    });

    app.use('/', proxy);

    // healthchecks
    app.get('/healthz', (_req, res) => res.status(200).send('ok'));
    app.get('/readyz', (_req, res) => res.status(200).send('ready'));
    
    const server = http.createServer(app);
    // WebSocket/Server-Sent Events
    server.on('upgrade', proxy.upgrade);
    return server;
  }

  // Sem TARGET_URL: responde algo simples
  app.get('/', (_req, res) => {
    res.type('html').send(
      `<h1>bioma-dash online</h1>
       <p>Defina a variável de ambiente <code>TARGET_URL</code> no Render para habilitar o proxy.</p>`
    );
  });
  app.get('/healthz', (_req, res) => res.status(200).send('ok'));

  return http.createServer(app);
}

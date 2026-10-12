// Tiny static file server (Node built-ins only). Used by e2e tests and the screenshots script.
// Runs in WSL as well as on Windows; it never imports anything from the repo root node_modules.
//   node scripts/static-server.mjs [port] [dir]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

export function startServer(root, port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) { res.writeHead(403).end('forbidden'); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404).end('not found'); return; }
    const headers = { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' };
    if (path.basename(file) === 'sw.js') headers['Cache-Control'] = 'no-cache';
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 4173);
  const root = path.resolve(process.argv[3] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public'));
  const { port: p } = await startServer(root, port);
  console.log(`serving ${root} at http://127.0.0.1:${p}/`);
}

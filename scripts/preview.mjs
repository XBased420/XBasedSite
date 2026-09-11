// Portable preview of the same HTML renderer; never invokes Astro or its compiler.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import settings, { deployment } from '../site.config.mjs';
import { renderPage } from '../src/render.mjs';
const root = fileURLToPath(new URL('../public/', import.meta.url));
const location = deployment(settings);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp' };
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/' || path === location.base) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(renderPage({ settings, ...location, base: '/' })); return; }
    const target = resolve(root, `.${path}`);
    if (!target.startsWith(resolve(root) + sep)) { res.writeHead(403); res.end(); return; }
    const data = await readFile(target); const extension = '.' + target.split('.').at(-1);
    res.writeHead(200, { 'Content-Type': types[extension] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(4321, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4321/'));

#!/usr/bin/env node
/* HAZOOM OS — Birds Encyclopedia (local-only, port 4100).
 * Zero-dependency Node server. Serves the encyclopedia at / and the
 * atlas view at /atlas/, plus JSON API under /api/birds. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4100;
const ROOT = path.join(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const birds = JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'data', 'birds.json'), 'utf8'));

function serveFile(res, rel) {
  if (rel === '/' || rel === '') rel = 'index.html';
  if (rel === '/atlas' || rel === '/atlas/') rel = 'atlas.html';
  const full = path.normalize(path.join(ROOT, rel));
  if (!full.startsWith(ROOT) || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('not found');
  }
  const ext = path.extname(full).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(full).pipe(res);
}

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const p = url.pathname;

  if (p === '/api/birds') return json(res, 200, { count: birds.length, birds });
  const m = p.match(/^\/api\/birds\/([a-z0-9-]+)$/);
  if (m) {
    const b = birds.find(x => x.id === m[1]);
    return b ? json(res, 200, b) : json(res, 404, { error: 'bird not found' });
  }
  if (p === '/api/health') return json(res, 200, { status: 'ok', service: 'birds-encyclopedia' });
  if (p === '/atlas' || p === '/atlas/') return serveFile(res, '/atlas/');
  return serveFile(res, p);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[HAZOOM] Birds Encyclopedia on http://127.0.0.1:${PORT}/ (atlas /atlas/)`);
});
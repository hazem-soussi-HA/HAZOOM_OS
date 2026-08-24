/**
 * MIRROR TRANSCENDANCE — HAZOOM VESSEL
 * =====================================
 * HTTP server + WebSocket + HAZOOM MTI engine
 *
 * © HAZOOM — Mirroring Transcendance Intelligence
 * Protected by HAZOOM copyright. All rights reserved.
 * Hazem Soussi — Lead Computing Architect
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const HAZOOM = require('../hazoom');

const PORT = process.env.MIRROR_PORT || 9090;
const SSL_DIR = path.join(__dirname, 'ssl');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ═══════════════════════════════════════════════════════════
// TLS / SSL — Encrypt all transport
// ═══════════════════════════════════════════════════════════

const sslKeyPath = path.join(SSL_DIR, 'hazoom.key');
const sslCertPath = path.join(SSL_DIR, 'hazoom.crt');
const hasSSL = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

let server;
const protocol = hasSSL ? 'https' : 'http';
const wsProtocol = hasSSL ? 'wss' : 'ws';

if (hasSSL) {
  const sslOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath)
  };
  server = https.createServer(sslOptions, handler);
  console.log('  ◈ TLS: ACTIVE (AES-256-GCM + RSA 4096)');
} else {
  server = http.createServer(handler);
  console.log('  ◈ TLS: DISABLED (run certificate-gen.sh to enable)');
}

// ═══════════════════════════════════════════════════════════
// HTTP REQUEST HANDLER
// ═══════════════════════════════════════════════════════════

function handler(req, res) {
  let filePath;

  if (req.url === '/' || req.url === '/splash') {
    filePath = 'splash.html';
  } else if (req.url === '/mirror') {
    filePath = 'index.html';
  } else if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(HAZOOM.getStatus(), null, 2));
    return;
  } else if (req.url === '/api/map') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(HAZOOM.getConsciousnessMap());
    return;
  } else if (req.url === '/api/reflect' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { text, sessionId } = JSON.parse(body);
        const sid = sessionId || 'default';
        const result = HAZOOM.reflect(sid, text);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result, null, 2));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  } else {
    filePath = req.url;
  }

  filePath = path.join(PUBLIC_DIR, filePath);
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('NOT FOUND');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
}

// ═══════════════════════════════════════════════════════════
// WEBSOCKET SERVER — HAZOOM real-time reflection
// ═══════════════════════════════════════════════════════════

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  console.log(`  ◈ HAZOOM connection: ${clientIp} [${sessionId}]`);

  // Send welcome
  ws.send(JSON.stringify({
    type: 'connected',
    sessionId,
    brand: HAZOOM.brand,
    technology: HAZOOM.technology,
    version: HAZOOM.version,
    copyright: HAZOOM.copyright.notice,
    message: 'HAZOOM is online. The mirror is ready.'
  }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'reflect' && msg.text) {
        const result = HAZOOM.reflect(sessionId, msg.text);
        ws.send(JSON.stringify({
          type: 'reflection',
          ...result
        }));
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      } else if (msg.type === 'map') {
        ws.send(JSON.stringify({
          type: 'map',
          data: HAZOOM.getConsciousnessMap()
        }));
      } else if (msg.type === 'status') {
        ws.send(JSON.stringify({
          type: 'status',
          data: HAZOOM.getStatus()
        }));
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type. Use: reflect, ping, map, status'
        }));
      }
    } catch (e) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Parse error: ' + e.message
      }));
    }
  });

  ws.on('close', () => {
    console.log(`  ◈ HAZOOM disconnected: ${sessionId}`);
  });

  ws.on('error', () => {});
});

// ═══════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════╗');
  console.log('  ║           HAZOOM — MIRROR TRANSCENDANCE              ║');
  console.log('  ║       Mirroring Transcendance Intelligence           ║');
  console.log('  ║                                                      ║');
  console.log('  ║   MODEL      ⟡ HAZOOM v0.2.0                        ║');
  console.log('  ║   TECHNOLOGY  ⟡ MTI (Mirroring Transcendance)        ║');
  console.log('  ║   VESSEL      ⟡ ' + protocol + ' + ' + wsProtocol + '                     ║');
  console.log('  ║   STATUS      ⟡ ONLINE                              ║');
  console.log('  ║                                                      ║');
  console.log('  ║   ENCRYPTION  ⟡ AES-256-GCM                         ║');
  console.log('  ║   TRANSPORT   ⟡ ' + (hasSSL ? 'TLS 1.3 (RSA 4096)' : 'HTTP (plain)') + '              ║');
  console.log('  ║   MEMORY      ⟡ Encrypted at rest                   ║');
  console.log('  ║   INTEGRITY   ⟡ SHA-256                             ║');
  console.log('  ║                                                      ║');
  console.log('  ║   ' + protocol + '://localhost:' + PORT + '                      ║');
  console.log('  ║   ' + wsProtocol + '://localhost:' + PORT + '                        ║');
  console.log('  ║                                                      ║');
  console.log('  ║   "The mirror doesn\'t lie. That\'s why it scares      ║');
  console.log('  ║    you. That\'s why you need it."                     ║');
  console.log('  ║                                                      ║');
  console.log('  ║   © HAZOOM — All rights reserved.                    ║');
  console.log('  ║   Hazem Soussi — Lead Computing Architect            ║');
  console.log('  ╚══════════════════════════════════════════════════════╝');
  console.log('');
});

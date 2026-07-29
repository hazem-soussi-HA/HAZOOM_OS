const express = require('express');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const ROOT = path.join(__dirname, '..');
const TERRAIN_BIN = path.join(ROOT, 'terrain_gen');
const EARTH_BIN = path.join(ROOT, 'earth_sim');
const JS_FALLBACK = true;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(ROOT));

function checkBinary(binPath) {
  try {
    fs.accessSync(binPath, fs.constants.X_OK);
    return true;
  } catch { return false; }
}

function broadcastToClients(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

app.get('/api/status', (req, res) => {
  res.json({
    terrainBinary: checkBinary(TERRAIN_BIN),
    earthBinary: checkBinary(EARTH_BIN),
    jsFallback: JS_FALLBACK,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cwd: ROOT
  });
});

app.post('/api/terrain/generate', async (req, res) => {
  const params = req.body || {};
  const useNative = params.useNative !== false && checkBinary(TERRAIN_BIN);

  if (useNative) {
    broadcastToClients({ type: 'log', source: 'terrain', msg: '[native] Starting terrain_gen binary...' });
    const startTime = Date.now();
    const child = spawn(TERRAIN_BIN, [], { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];

    child.stdout.on('data', (data) => {
      chunks.push(data);
      broadcastToClients({ type: 'progress', source: 'terrain', bytes: chunks.reduce((a,b) => a+b.length, 0) });
    });

    child.stderr.on('data', (data) => {
      broadcastToClients({ type: 'log', source: 'terrain', msg: `[stderr] ${data.toString().trim()}` });
    });

    child.on('close', (code) => {
      const elapsed = Date.now() - startTime;
      if (code !== 0) {
        broadcastToClients({ type: 'log', source: 'terrain', msg: `[native] Exited with code ${code}` });
        return res.status(500).json({ error: `Binary exited with code ${code}` });
      }
      const buf = Buffer.concat(chunks);
      broadcastToClients({ type: 'log', source: 'terrain', msg: `[native] Done: ${buf.length} bytes in ${elapsed}ms` });
      res.json({
        data: Array.from(buf),
        size: buf.length,
        elapsed,
        source: 'native'
      });
    });

    child.on('error', (err) => {
      res.status(500).json({ error: err.message });
    });
  } else {
    broadcastToClients({ type: 'log', source: 'terrain', msg: '[js] Using JS fallback...' });
    const startTime = Date.now();
    const { generateTerrain } = require('./fallback.js');
    const result = generateTerrain(params);
    const elapsed = Date.now() - startTime;
    broadcastToClients({ type: 'log', source: 'terrain', msg: `[js] Done in ${elapsed}ms` });
    res.json({ ...result, elapsed, source: 'js' });
  }
});

app.post('/api/earth/generate', async (req, res) => {
  const params = req.body || {};
  const useNative = params.useNative !== false && checkBinary(EARTH_BIN);

  if (useNative) {
    broadcastToClients({ type: 'log', source: 'earth', msg: '[native] Starting earth_sim binary...' });
    const startTime = Date.now();
    const child = spawn(EARTH_BIN, [], { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];

    child.stdout.on('data', (data) => {
      chunks.push(data);
      broadcastToClients({ type: 'progress', source: 'earth', bytes: chunks.reduce((a,b) => a+b.length, 0) });
    });

    child.stderr.on('data', (data) => {
      broadcastToClients({ type: 'log', source: 'earth', msg: `[stderr] ${data.toString().trim()}` });
    });

    child.on('close', (code) => {
      const elapsed = Date.now() - startTime;
      if (code !== 0) {
        return res.status(500).json({ error: `Binary exited with code ${code}` });
      }
      const buf = Buffer.concat(chunks);
      broadcastToClients({ type: 'log', source: 'earth', msg: `[native] Done: ${buf.length} bytes in ${elapsed}ms` });
      res.json({
        data: Array.from(buf),
        size: buf.length,
        elapsed,
        source: 'native'
      });
    });
  } else {
    broadcastToClients({ type: 'log', source: 'earth', msg: '[js] Using JS fallback...' });
    const startTime = Date.now();
    const { generateEarth } = require('./fallback.js');
    const result = generateEarth(params);
    const elapsed = Date.now() - startTime;
    res.json({ ...result, elapsed, source: 'js' });
  }
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'status', connected: true }));
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`HAZOOM Server running at http://localhost:${PORT}`);
  console.log(`  terrain_gen: ${checkBinary(TERRAIN_BIN) ? 'AVAILABLE' : 'NOT FOUND (JS fallback active)'}`);
  console.log(`  earth_sim:   ${checkBinary(EARTH_BIN) ? 'AVAILABLE' : 'NOT FOUND (JS fallback active)'}`);
});

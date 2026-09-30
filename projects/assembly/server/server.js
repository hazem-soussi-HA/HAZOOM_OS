const express = require('express');
const { spawn } = require('child_process');
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
const HOST = process.env.HOST || '127.0.0.1';
const API_KEY = (process.env.HAZOOM_CLOUD_API_KEY || '').trim();
const NATIVE_TERRAIN_ENABLED = process.env.HAZOOM_CLOUD_ENABLE_NATIVE_TERRAIN === '1';
const NATIVE_EARTH_EXPERIMENTAL = process.env.HAZOOM_CLOUD_ENABLE_UNSAFE_EARTH === '1';
const NATIVE_TIMEOUT_MS = Math.max(1000, Math.min(Number(process.env.HAZOOM_CLOUD_NATIVE_TIMEOUT_MS) || 15000, 120000));
const MAX_NATIVE_BYTES = 32 * 1024 * 1024;
const TERRAIN_LIMITS = { width: 512, height: 512, cells: 512 * 512 };
const EARTH_LIMITS = { width: 512, height: 256, cells: 512 * 256 };
const MAX_RAW_CELLS = 128 * 128;

if ((process.env.NODE_ENV === 'production' || !['127.0.0.1', 'localhost', '::1'].includes(HOST)) && !API_KEY) {
  console.error('HAZOOM_CLOUD_API_KEY is required for non-loopback or production Cloud');
  process.exit(1);
}

app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
const PUBLIC_FILES = new Set(['dashboard.html', 'earth.html', 'nature_landscape.html', 'terrain_webgl.html']);
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'dashboard.html')));
app.get('/earth_sim.asm', requireApiKey, (req, res) => res.sendFile(path.join(ROOT, 'earth_sim.asm')));
for (const file of PUBLIC_FILES) {
  app.get(`/${file}`, (req, res) => res.sendFile(path.join(ROOT, file)));
}

function requireApiKey(req, res, next) {
  if (!API_KEY && process.env.NODE_ENV !== 'production') return next();
  const supplied = req.get('X-API-Key') || '';
  if (!supplied || supplied !== API_KEY) return res.status(401).json({ error: 'unauthorized', code: 'UNAUTHORIZED' });
  return next();
}

function checkBinary(binPath) {
  try {
    fs.accessSync(binPath, fs.constants.X_OK);
    return true;
  } catch { return false; }
}

function normalizeParams(engine, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new TypeError('Request body must be a JSON object');
  }
  const limits = engine === 'terrain' ? TERRAIN_LIMITS : EARTH_LIMITS;
  const defaults = engine === 'terrain' ? { width: 256, height: 256 } : { width: 512, height: 256 };
  const readInteger = (key, fallback, maximum) => {
    const raw = body[key] === undefined ? fallback : Number(body[key]);
    if (!Number.isSafeInteger(raw) || raw < 1 || raw > maximum) {
      throw new RangeError(`${key} must be an integer between 1 and ${maximum}`);
    }
    return raw;
  };
  for (const key of ['useNative', 'includeRaw']) {
    if (key in body && typeof body[key] !== 'boolean') throw new TypeError(`${key} must be boolean`);
  }
  const gridW = readInteger('gridW', defaults.width, limits.width);
  const gridH = readInteger('gridH', defaults.height, limits.height);
  if (gridW * gridH > limits.cells) throw new RangeError('Requested grid is too large');
  if (body.includeRaw === true && gridW * gridH > MAX_RAW_CELLS) {
    throw new RangeError('Raw output is limited to 16384 cells; request a preview instead');
  }
  const normalized = { ...body, gridW, gridH, useNative: body.useNative === true, includeRaw: body.includeRaw === true };
  if (engine === 'terrain') {
    for (const [key, fallback, minimum, maximum] of [['scale', 20, 0.1, 1000], ['heightMul', 4, 0.1, 100]]) {
      if (key in body) {
        const value = Number(body[key]);
        if (!Number.isFinite(value) || value < minimum || value > maximum) {
          throw new RangeError(`${key} must be between ${minimum} and ${maximum}`);
        }
        normalized[key] = value;
      } else {
        normalized[key] = fallback;
      }
    }
  }
  return normalized;
}

function inspectTerrainBinary(buffer) {
  if (buffer.length < 24 || buffer.toString('ascii', 0, 4) !== 'HZTR') throw new Error('Native terrain output has an invalid header');
  const gridW = buffer.readUInt32LE(4);
  const gridH = buffer.readUInt32LE(8);
  const stride = buffer.readUInt32LE(12);
  const indexCount = buffer.readUInt32LE(16);
  if (gridW < 1 || gridH < 1 || stride !== 48 || gridW > TERRAIN_LIMITS.width || gridH > TERRAIN_LIMITS.height) {
    throw new Error('Native terrain output dimensions are invalid');
  }
  const expectedLength = 24 + gridW * gridH * stride + indexCount * 4;
  if (expectedLength !== buffer.length) throw new Error('Native terrain output length does not match its header');
  const heights = new Float32Array(gridW * gridH);
  for (let index = 0; index < heights.length; index++) {
    const value = buffer.readFloatLE(24 + index * stride + 4);
    if (!Number.isFinite(value)) throw new Error('Native terrain output contains non-finite heights');
    heights[index] = value;
  }
  return { gridW, gridH, vertexCount: gridW * gridH, indexCount, format: 'HZTR', heights };
}

function runNative(binPath, source, timeoutMs = NATIVE_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = spawn(binPath, [], { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];
    let size = 0;
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(new Error(`${source} native execution timed out`));
    }, timeoutMs);
    child.stdout.on('data', (data) => {
      size += data.length;
      if (size > MAX_NATIVE_BYTES) {
        child.kill('SIGKILL');
        finish(new Error(`${source} native output exceeded the size limit`));
        return;
      }
      chunks.push(data);
      broadcastToClients({ type: 'progress', source, bytes: size });
    });
    child.stderr.on('data', (data) => {
      broadcastToClients({ type: 'log', source, msg: `[stderr] ${data.toString().trim()}` });
    });
    child.on('error', (error) => finish(error));
    child.on('close', (code, signal) => {
      if (code !== 0) finish(new Error(`${source} native exited with code ${code}${signal ? ` (${signal})` : ''}`));
      else finish(null, Buffer.concat(chunks));
    });
  });
}

function rawResult(result, params) {
  if (!params.includeRaw) return {};
  const { gridW, gridH, vertexCount, indexCount, positions, vertices, indices, heightmap, elevation, temperature, precipitation, biomeMap, vegetation } = result;
  return { positions, vertices, indices, heightmap, elevation, temperature, precipitation, biomeMap, vegetation, gridW, gridH, vertexCount, indexCount };
}

app.use(['/api/terrain', '/api/v1/terrain'], requireApiKey);
app.use(['/api/earth', '/api/v1/earth'], requireApiKey);

function broadcastToClients(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

app.get('/api/status', requireApiKey, (req, res) => {
  const terrainBinary = checkBinary(TERRAIN_BIN);
  const earthBinary = checkBinary(EARTH_BIN);
  res.json({
    terrainBinary,
    earthBinary,
    nativeTerrainEnabled: NATIVE_TERRAIN_ENABLED && terrainBinary,
    nativeEarthEnabled: false,
    nativeEarthExperimental: NATIVE_EARTH_EXPERIMENTAL && earthBinary,
    jsFallback: JS_FALLBACK,
    productMode: 'terrain-reference',
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cwd: ROOT
  });
});

app.post(['/api/terrain/generate', '/api/v1/terrain/generate'], async (req, res) => {
  let params;
  try {
    params = normalizeParams('terrain', req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message, code: 'INVALID_PARAMS' });
  }
  const nativeShape = params.gridW === 256 && params.gridH === 256 && params.scale === 20 && params.heightMul === 4;
  const nativeRequested = params.useNative;
  const nativeReady = NATIVE_TERRAIN_ENABLED && checkBinary(TERRAIN_BIN) && nativeShape;
  const startTime = Date.now();
  const { makePreview } = require('./fallback.js');
  let result;
  let source = 'js';
  let fallbackReason = params.useNative && !nativeReady ? 'native_unavailable_or_shape_mismatch' : undefined;
  if (nativeRequested && nativeReady) {
    try {
      broadcastToClients({ type: 'log', source: 'terrain', msg: '[native] Starting terrain_gen binary...' });
      const buffer = await runNative(TERRAIN_BIN, 'terrain');
      const inspected = inspectTerrainBinary(buffer);
      result = { ...inspected, size: buffer.length, data: Array.from(buffer), format: 'HZTR', preview: makePreview(inspected.heights, inspected.gridW, inspected.gridH) };

      source = 'native';
      fallbackReason = undefined;
    } catch (error) {
      broadcastToClients({ type: 'log', source: 'terrain', msg: `[native] ${error.message}; using reference generator` });
      fallbackReason = 'native_failed';
    }
  }
  if (!result) {
    broadcastToClients({ type: 'log', source: 'terrain', msg: '[reference] Using bounded JS terrain generator...' });
    const { generateTerrain } = require('./fallback.js');
    result = generateTerrain(params);
    result.preview = makePreview(result.heightmap, result.gridW, result.gridH);
  }
  const elapsed = Date.now() - startTime;
  const response = {
    engine: 'terrain',
    source,
    gridW: result.gridW,
    gridH: result.gridH,
    vertexCount: result.vertexCount,
    indexCount: result.indexCount,
    size: result.size,
    format: result.format || 'terrain-reference',
    elapsed,
    dataAvailable: params.includeRaw,
    preview: result.preview,
    fallbackReason,
  };
  Object.assign(response, rawResult(result, params));
  if (source === 'native' && params.includeRaw) response.data = result.data;
  res.json(response);
});

app.post(['/api/earth/generate', '/api/v1/earth/generate'], async (req, res) => {
  let params;
  try {
    params = normalizeParams('earth', req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message, code: 'INVALID_PARAMS' });
  }
  const startTime = Date.now();
  const { generateEarth, makePreview } = require('./fallback.js');
  const result = generateEarth(params);
  const elapsed = Date.now() - startTime;
  const response = {
    engine: 'earth',
    source: 'js',
    gridW: result.gridW,
    gridH: result.gridH,
    format: 'earth-reference',
    elapsed,
    dataAvailable: params.includeRaw,
    preview: makePreview(result.elevation, result.gridW, result.gridH),
    fallbackReason: params.useNative ? 'native_earth_quarantined' : undefined,
  };
  Object.assign(response, rawResult(result, params));
  res.json(response);
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'status', connected: true }));
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, HOST, () => {
  console.log(`HAZOOM Server running at http://${HOST}:${PORT}`);
  console.log(`  terrain_gen: ${NATIVE_TERRAIN_ENABLED && checkBinary(TERRAIN_BIN) ? 'ENABLED' : 'REFERENCE FALLBACK'}`);
  console.log(`  earth_sim:   QUARANTINED (reference fallback only)`);
});

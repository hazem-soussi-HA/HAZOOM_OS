import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Use an isolated temp DB so the test never touches the real data/ file.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TMP_DB = path.join(os.tmpdir(), `birds-test-${Date.now()}.db`);

process.env.DB_PATH = TMP_DB;
process.env.JWT_SECRET = 'test-secret';
process.env.PORT = '0'; // let the OS pick a free port
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.ADMIN_EMAIL = 'admin@birds.local';

const { app } = await import('./server.js');
const { seed } = await import('./seed.js');

seed();

const server = app.listen(0, async () => {
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  const results = [];
  const ok = (name, cond, detail = '') => {
    results.push({ name, pass: !!cond, detail });
    console.log(`${cond ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  };

  const req = (method, p, { token, body } = {}) =>
    new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : null;
      const r = http.request(`${base}${p}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      }, (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          let json; try { json = JSON.parse(buf); } catch { json = {}; }
          resolve({ status: res.statusCode, json });
        });
      });
      r.on('error', reject);
      if (data) r.write(data);
      r.end();
    });

  try {
    // Health
    const health = await req('GET', '/api/health');
    ok('health check', health.status === 200);

    // Seed produced data
    const list = await req('GET', '/api/birds?limit=5');
    ok('seed populated birds', list.json.total >= 10, `${list.json.total} birds`);
    const topics = await req('GET', '/api/topics');
    ok('seed populated topics', topics.json.topics.length >= 10, `${topics.json.topics.length} topics`);

    // Register + login
    const uname = 'editor1';
    const reg = await req('POST', '/api/auth/register', { body: { username: uname, email: 'e1@x.com', password: 'secret123' } });
    ok('register', reg.status === 201 && reg.json.token, `user ${uname}`);
    const login = await req('POST', '/api/auth/login', { body: { username: uname, password: 'secret123' } });
    ok('login', login.status === 200 && login.json.token);
    const token = login.json.token;

    // Auth required to create
    const noAuth = await req('POST', '/api/birds', { body: { common_name: 'X', scientific_name: 'X y' } });
    ok('create requires auth', noAuth.status === 401);

    // Create (auth)
    const created = await req('POST', '/api/birds', {
      token,
      body: {
        common_name: 'Test Sparrow', scientific_name: 'Passer testus',
        order_name: 'Passeriformes', family: 'Passeridae', conservation_status: 'LC',
        description: 'A test bird.', fun_facts: ['fact one', 'fact two'],
      },
    });
    ok('create bird (auth)', created.status === 201, `id ${created.json.id}`);
    const newId = created.json.id;
    ok('fun_facts stored as array', Array.isArray(created.json.fun_facts));

    // Get
    const got = await req('GET', `/api/birds/${newId}`);
    ok('get bird', got.json.id === newId && got.json.common_name === 'Test Sparrow');

    // Search
    const search = await req('GET', '/api/birds?q=Test');
    ok('search by name', search.json.rows.some((b) => b.id === newId));

    // Update
    const upd = await req('PUT', `/api/birds/${newId}`, { token, body: { description: 'Updated.' } });
    ok('update bird', upd.status === 200 && upd.json.description === 'Updated.');

    // Duplicate scientific name rejected
    const dup = await req('POST', '/api/birds', { token, body: { common_name: 'Dup', scientific_name: 'Passer testus' } });
    ok('duplicate scientific name rejected', dup.status === 409);

    // Sound classification: create + round-trip
    const soundBird = await req('POST', '/api/birds', {
      token,
      body: {
        common_name: 'Singing Finch', scientific_name: 'Fringilla cantans',
        order_name: 'Passeriformes', family: 'Fringillidae',
        sound_type: 'Song', sound_band: 'High',
        sound_description: 'Clear, fluty warbling song.',
      },
    });
    ok('create bird with sound classification', soundBird.status === 201, `id ${soundBird.json.id}`);
    ok('sound_type stored', soundBird.json.sound_type === 'Song');
    ok('sound_band stored', soundBird.json.sound_band === 'High');
    ok('sound_description stored', soundBird.json.sound_description && soundBird.json.sound_description.includes('warbling'));

    // Sound filter
    const bySound = await req('GET', '/api/birds?sound=Song');
    ok('filter by sound type', bySound.json.rows.length >= 1 && bySound.json.rows.every((b) => b.sound_type === 'Song'));

    // Invalid sound vocabulary rejected (400)
    const badSound = await req('POST', '/api/birds', {
      token,
      body: { common_name: 'Mystery Bird', scientific_name: 'Mysteria avis', sound_type: 'Scream' },
    });
    ok('invalid sound_type rejected with 400', badSound.status === 400);

    // Topic create + get
    const tCreate = await req('POST', '/api/topics', { token, body: { slug: 'test-topic', title: 'Test', category: 'Test', content: 'hello' } });
    ok('create topic', tCreate.status === 201);
    const tGet = await req('GET', '/api/topics/test-topic');
    ok('get topic by slug', tGet.json.slug === 'test-topic');

    // Delete requires admin (editor must be denied)
    const delDenied = await req('DELETE', `/api/birds/${newId}`, { token });
    ok('delete denied for editor', delDenied.status === 403);

    // Admin login + delete
    const adminLogin = await req('POST', '/api/auth/login', { body: { username: 'admin', password: 'admin123' } });
    ok('admin login', adminLogin.status === 200 && adminLogin.json.user.role === 'admin');
    const adminToken = adminLogin.json.token;
    const delOk = await req('DELETE', `/api/birds/${newId}`, { token: adminToken });
    ok('admin can delete', delOk.status === 200);
    const afterDel = await req('GET', `/api/birds/${newId}`);
    ok('bird gone after delete', afterDel.status === 404);

    const failed = results.filter((r) => !r.pass);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
    server.close();
    cleanup();
    process.exit(failed.length ? 1 : 0);
  } catch (e) {
    console.error('Test crashed:', e);
    server.close();
    cleanup();
    process.exit(1);
  }
});

function cleanup() {
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    try { fs.unlinkSync(TMP_DB + suffix); } catch {}
  }
}

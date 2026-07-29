/**
 * smoke.test.js — Isolated end-to-end check of the Hazoom backend.
 * Uses a throwaway SQLite file (TMP_DB) so it never touches app data.
 */
process.env.JWT_SECRET = 'test_secret_123';
process.env.SQLITE_PATH = require('path').join(require('os').tmpdir(), 'hazoom_smoke.db');
process.env.SEED_ADMIN_EMAIL = 'admin@test.local';
process.env.SEED_ADMIN_PASSWORD = 'Admin123!';

const fs = require('fs');
const net = require('net');

// Remove any stale temp db.
try { fs.rmSync(process.env.SQLITE_PATH); } catch {}

const app = require('./server/server.js');
const User = require('./server/models/User');
const Order = require('./server/models/Order');
const jwt = require('jsonwebtoken');

function req(opts, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = require('http').request({
      host: '127.0.0.1', port: PORT, path: opts.path, method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    }, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => resolve({ status: res.statusCode, body: buf ? JSON.parse(buf) : {} }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

const PORT = 4123;

(async () => {
  const http = require('http');
  await new Promise((res) => {
    const srv = http.createServer(app).listen(PORT, () => { app.__srv = srv; res(); });
  });

  const results = [];
  const assert = (name, cond, extra='') => { results.push((cond?'PASS':'FAIL')+'  '+name+(extra?'  '+extra:'')); if(!cond) process.exitCode=1; };

  // 1. health + config
  const health = await req({ path: '/api/health' });
  assert('health ok', health.status === 200 && health.body.ok);

  // 2. register
  const reg = await req({ path: '/api/auth/register', method: 'POST' }, { email: 'smoke@test.local', password: 'secret123', name: 'Smoke' });
  assert('register 201', reg.status === 201, 'got '+reg.status);
  const token = reg.body.token;
  assert('jwt issued', !!token);

  // 3. login
  const login = await req({ path: '/api/auth/login', method: 'POST' }, { email: 'smoke@test.local', password: 'secret123' });
  assert('login 200', login.status === 200 && !!login.body.token);

  // 4. duplicate register rejected
  const dup = await req({ path: '/api/auth/register', method: 'POST' }, { email: 'smoke@test.local', password: 'secret123' });
  assert('dup email 409', dup.status === 409, 'got '+dup.status);

  // 5. wrong password rejected
  const bad = await req({ path: '/api/auth/login', method: 'POST' }, { email: 'smoke@test.local', password: 'wrong' });
  assert('bad pwd 401', bad.status === 401);

  // 6. products listed (seeded)
  const prods = await req({ path: '/api/products' });
  assert('products seeded', prods.status===200 && prods.body.products.length>=4, 'count='+(prods.body.products||[]).length);
  const pid = prods.body.products[0].id;

  // 7. category filter
  const tshirts = await req({ path: '/api/products?category=tshirt' });
  assert('category filter', tshirts.body.products.every(p=>p.category==='tshirt'));

  // 8. payment intent (offline)
  const intent = await req({ path: '/api/payment/create-intent', method: 'POST' }, { amount: 2497 });
  assert('payment intent', intent.status===200 && intent.body.offline===true);

  // 9. confirm order
  const order = await req({ path: '/api/payment/confirm', method: 'POST', headers:{ Authorization:'Bearer '+token } },
    { items:[{productId:pid,title:'T',price:1999,quantity:1,color:'#000'}],
      shipping:{firstName:'A',lastName:'B',email:'smoke@test.local',address1:'1 St',city:'T',zip:'00000',country:'US'},
      billing:null, paymentIntentId:'offline' });
  assert('order created', order.status===201 && order.body.order.id, 'got '+order.status);
  const oid = order.body.order.id;

  // 10. my orders
  const mine = await req({ path: '/api/orders', headers:{ Authorization:'Bearer '+token } });
  assert('my orders', mine.body.orders.some(o=>o.id===oid));

  // 11. admin seed + guard
  const adminLogin = await req({ path: '/api/auth/login', method:'POST' }, { email:'admin@test.local', password:'Admin123!' });
  const adminToken = adminLogin.body.token;
  assert('admin seeded', !!adminToken);
  const adminOrders = await req({ path: '/api/orders/all/list', headers:{ Authorization:'Bearer '+adminToken } });
  assert('admin sees all orders', adminOrders.status===200);

  // 12. analytics
  const analytics = await req({ path: '/api/orders/analytics/metrics', headers:{ Authorization:'Bearer '+adminToken } });
  assert('analytics', analytics.status===200 && typeof analytics.body.totalRevenue==='number');

  // 13. fulfill to printify (mock)
  const fulfill = await req({ path: '/api/orders/'+oid+'/fulfill', method:'POST', headers:{ Authorization:'Bearer '+adminToken } });
  assert('fulfill mock', fulfill.status===200 && fulfill.body.order.status==='fulfilled', 'got '+fulfill.status);

  // 14. admin product create/delete
  const created = await req({ path:'/api/products', method:'POST', headers:{Authorization:'Bearer '+adminToken} },
    { title:'Test', category:'mug', basePrice:999 });
  assert('product create', created.status===201);
  const del = await req({ path:'/api/products/'+created.body.product.id, method:'DELETE', headers:{Authorization:'Bearer '+adminToken} });
  assert('product delete', del.status===200);

  console.log('\n--- Hazoom smoke test ---');
  results.forEach(r=>console.log(r));
  const failed = results.filter(r=>r.startsWith('FAIL')).length;
  console.log(`\n${results.length-failed}/${results.length} passed`);
  app.__srv.close();
  try { fs.rmSync(process.env.SQLITE_PATH); } catch {}
  process.exit(failed?1:0);
})().catch(e=>{ console.error('TEST ERROR', e); process.exit(1); });

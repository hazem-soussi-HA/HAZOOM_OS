#!/usr/bin/env python3
"""
SOVEREIGN STATE GUI  —  "State of Two"  observer console
=========================================================
Local-first. No cloud. No network. Pure stdlib + one HTML page.
Reads the SAME ledger.jsonl + orders.jsonl the engine writes.

Run:  python3 gui.py
Then open the printed URL in your browser.

Digital Brain = engine  |  Human Brain = observer (you)
"""

import http.server
import json
import os
import socketserver
from datetime import timezone, datetime

from ledger import (LEDGER_FILE, CONFIG_FILE, load_config, cmd_verify)
from checkout import ORDERS_FILE, is_public_addr

STATE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 4747


def read_chain():
    rows = []
    if os.path.exists(LEDGER_FILE):
        with open(LEDGER_FILE) as f:
            for line in f:
                if line.strip():
                    rows.append(json.loads(line))
    return rows


def read_orders():
    out = []
    if os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE) as f:
            for line in f:
                if line.strip():
                    out.append(json.loads(line))
    return out


def compute_state():
    cfg = load_config()
    rows = read_chain()
    owner_in = owner_out = peace = 0.0
    cur = "SOVEREIGN"
    for e in rows:
        cur = e.get("currency", cur)
        if e["type"] == "receive":
            peace_part = e["amount"] * cfg["peace_rate"]
            owner_in += e["amount"] - peace_part
            peace += peace_part
        elif e["type"] == "pay":
            owner_out += e["amount"]
    net = owner_in - owner_out
    total_through = owner_in + owner_out + peace
    return {
        "owner": cfg["owner"], "peace_rate": cfg["peace_rate"],
        "peace_pool": cfg["peace_pool"], "currency": cur,
        "owner_in": round(owner_in, 4), "owner_out": round(owner_out, 4),
        "peace": round(peace, 4), "net": round(net, 4),
        "total_through": round(total_through, 4), "entries": len(rows),
        "chain_intact": cmd_verify(),
        "orders": read_orders(),
        "last_update": datetime.now(timezone.utc).isoformat(),
    }


HTML = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SOVEREIGN STATE — Observer</title>
<style>
  :root{--bg:#0a0e14;--card:#121821;--line:#1e2733;--tx:#e6edf3;--dim:#7d8a99;
        --gold:#f5c451;--green:#3fb950;--blue:#58a6ff;--red:#ff6b6b;--purple:#bc8cff}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--tx);font:15px/1.5 ui-monospace,Menlo,Consolas,monospace;padding:22px}
  h1{font-size:20px;letter-spacing:1px;color:var(--gold)}
  .sub{color:var(--dim);font-size:12px;margin:4px 0 18px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:18px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px}
  .card .k{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:1px}
  .card .v{font-size:22px;margin-top:6px}
  .gold{color:var(--gold)} .green{color:var(--green)} .blue{color:var(--blue)} .red{color:var(--red)} .purple{color:var(--purple)}
  table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:18px}
  th,td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);font-size:13px}
  th{color:var(--dim);font-weight:normal;text-transform:uppercase;font-size:11px;letter-spacing:1px}
  tr:last-child td{border-bottom:none}
  .tag{padding:2px 8px;border-radius:20px;font-size:11px}
  .t-recv{background:#10301a;color:var(--green)} .t-peace{background:#2a2410;color:var(--gold)}
  .t-pay{background:#2a1414;color:var(--red)} .t-gen{background:#101d2e;color:var(--blue)}
  .t-ord{background:#231a2e;color:var(--purple)}
  .s-pend{background:#2a2410;color:var(--gold)} .s-ful{background:#10301a;color:var(--green)}
  .ok{color:var(--green)} .bad{color:var(--red)}
  .mono{color:var(--blue);font-size:12px}
  footer{color:var(--dim);font-size:11px;margin-top:4px}
</style></head><body>
<h1>◆ SOVEREIGN STATE — STATE OF TWO</h1>
<div class="sub" id="meta"></div>

<div class="grid" id="cards"></div>

<h3 style="margin:6px 0 10px;color:var(--dim);font-weight:normal;font-size:12px;letter-spacing:1px">TRANSACTIONS — LEDGER CHAIN</h3>
<table><thead><tr><th>#</th><th>TYPE</th><th>FROM → TO</th><th>AMOUNT</th><th>PURPOSE</th><th>TIME (UTC)</th></tr></thead>
<tbody id="chain"></tbody></table>

<h3 style="margin:6px 0 10px;color:var(--dim);font-weight:normal;font-size:12px;letter-spacing:1px">ORDERS — CLIENT FLOW</h3>
<table><thead><tr><th>ORDER</th><th>STATUS</th><th>CLIENT</th><th>PRODUCT</th><th>AMOUNT</th><th>PAY TO (public)</th><th>MEMO</th></tr></thead>
<tbody id="orders"></tbody></table>

<footer>Local-first · no cloud · reads ledger.jsonl + orders.jsonl · auto-refresh 4s · Digital Brain = engine, Human Brain = observer</footer>

<script>
async function load(){
  const r = await fetch('/api'); const d = await r.json();
  document.getElementById('meta').textContent =
    `Owner: ${d.owner}  ·  Peace rate: ${(d.peace_rate*100).toFixed(0)}% → ${d.peace_pool}  ·  Chain: `
    + `<span class="${d.chain_intact?'ok':'bad'}">${d.chain_intact?'INTACT ✓':'BROKEN ✗'}</span>`
    + `  ·  Updated ${new Date(d.last_update).toLocaleTimeString()}`;
  const cards=[['Net Treasury',d.net+' '+d.currency,'gold'],['Inflow (to owner)',d.owner_in+' '+d.currency,'green'],
    ['Outflow (paid)',d.owner_out+' '+d.currency,'red'],['PEACE POOL',d.peace+' '+d.currency,'blue'],
    ['Total Throughput',d.total_through+' '+d.currency,''],['Entries',d.entries,'']];
  document.getElementById('cards').innerHTML = cards.map(c=>
    `<div class="card"><div class="k">${c[0]}</div><div class="v ${c[2]}">${c[1]}</div></div>`).join('');
  const labels={receive:'RECEIVE',peace_alloc:'PEACE',pay:'PAY',genesis:'GENESIS',order_pending:'ORDER'};
  const cls={receive:'t-recv',peace_alloc:'t-peace',pay:'t-pay',genesis:'t-gen',order_pending:'t-ord'};
  document.getElementById('chain').innerHTML = d.rows.map((e,i)=>{
    const who=e.type==='genesis'?e.actor:`${e.from||''} → ${e.to||''}`;
    const t=(e.ts||'').replace('T',' ').slice(0,19);
    return `<tr><td>${i}</td><td><span class="tag ${cls[e.type]||''}">${labels[e.type]||e.type}</span></td>`
      +`<td>${who}</td><td>${e.amount} ${e.currency}</td><td>${e.purpose||''}</td><td>${t}</td></tr>`;
  }).join('');
  const ocls={PENDING:'s-pend',FULFILLED:'s-ful'};
  document.getElementById('orders').innerHTML = (d.orders.length?d.orders:[]).map(o=>
    `<tr><td class="mono">${o.order_id}</td><td><span class="tag ${ocls[o.status]||''}">${o.status}</span></td>`
    +`<td>${o.client}</td><td>${o.product}</td><td>${o.amount} ${o.currency}</td>`
    +`<td class="mono">${o.pay_to}</td><td class="mono">SOVEREIGN-${o.order_id}</td></tr>`).join('')
    || `<tr><td colspan="7" style="color:var(--dim)">No orders yet. Open one: python3 checkout.py neworder ...</td></tr>`;
}
load(); setInterval(load,4000);
</script></body></html>"""


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(compute_state()).encode())
        elif self.path in ("/", "/index.html"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(HTML.encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *a):
        pass


def main():
    os.chdir(STATE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"[OK] Sovereign State GUI live: http://127.0.0.1:{PORT}")
        print(f"     (local-only, no cloud. Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[stopped]")


if __name__ == "__main__":
    main()

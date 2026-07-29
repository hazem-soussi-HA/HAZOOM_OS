#!/usr/bin/env python3
"""
SOVEREIGN STATE LEDGER  —  "State of Two"
==========================================
Digital Brain (AI)  -> engine, logic, code
Human Brain (Hazem) -> physical fair gatekeep, observer

Principles engineered in (not promised):
  1. OPEN LEDGER      : every tx is append-only + hash-chained -> tamper-EVIDENT
  2. NO MIDDLEMAN     : value moves payer -> owner, crypto direct, zero skim
  3. FAIR SHARE       : a fixed % of every incoming flow auto-routes to PEACE_POOL
                        coded in, cannot be switched off by whoever runs it.

Local-first: NO network calls. NO cloud. Stdlib only. Runs offline in a blackout.
Crypto layer: structure-ready. Needs Human Brain's wallet address/keys to go LIVE.

Owner : Hazem Soussi
Goal  : rain like rivers, shine like diamonds, peace not war.
"""

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone

STATE_DIR = os.path.dirname(os.path.abspath(__file__))
LEDGER_FILE = os.path.join(STATE_DIR, "ledger.jsonl")
CONFIG_FILE = os.path.join(STATE_DIR, "state.config.json")

OWNER = "Hazem Soussi"
PEACE_POOL = "PEACE_POOL@sovereign"
PEACE_RATE = 0.10  # 10% of every incoming flow -> fairness pool (engineered, fixed)


# ----------------------------------------------------------------------------- #
# core helpers
# ----------------------------------------------------------------------------- #
def now_iso():
    return datetime.now(timezone.utc).isoformat()


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_config():
    if not os.path.exists(CONFIG_FILE):
        cfg = {"owner": OWNER, "peace_pool": PEACE_POOL, "peace_rate": PEACE_RATE,
               "created": now_iso()}
        with open(CONFIG_FILE, "w") as f:
            json.dump(cfg, f, indent=2)
        return cfg
    with open(CONFIG_FILE) as f:
        return json.load(f)


def last_hash():
    if not os.path.exists(LEDGER_FILE):
        return "GENESIS"
    with open(LEDGER_FILE) as f:
        lines = [l for l in f if l.strip()]
    if not lines:
        return "GENESIS"
    return json.loads(lines[-1])["hash"]


def append_entry(entry: dict):
    entry["prev_hash"] = last_hash()
    payload = {k: v for k, v in entry.items() if k != "hash"}
    entry["hash"] = sha256(json.dumps(payload, sort_keys=True))
    with open(LEDGER_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    return entry


# ----------------------------------------------------------------------------- #
# commands
# ----------------------------------------------------------------------------- #
def cmd_init():
    cfg = load_config()
    # genesis entry
    append_entry({
        "idx": 0, "ts": now_iso(), "type": "genesis",
        "actor": cfg["owner"], "amount": 0.0, "currency": "SOVEREIGN",
        "purpose": "State of Two founded. Fairness engineered in.",
    })
    print(f"[OK] State founded under '{cfg['owner']}'.")
    print(f"     Peace rate locked at {cfg['peace_rate']*100:.0f}% -> {cfg['peace_pool']}")


def cmd_receive(payer, amount, currency, purpose):
    cfg = load_config()
    amount = float(amount)
    # main entry: value arrives to owner
    append_entry({
        "idx": None, "ts": now_iso(), "type": "receive",
        "from": payer, "to": cfg["owner"], "amount": amount,
        "currency": currency, "purpose": purpose,
    })
    # engineered fairness: auto-route peace portion
    peace = round(amount * cfg["peace_rate"], 8)
    append_entry({
        "idx": None, "ts": now_iso(), "type": "peace_alloc",
        "from": payer, "to": cfg["peace_pool"], "amount": peace,
        "currency": currency,
        "purpose": f"Auto fair-share ({cfg['peace_rate']*100:.0f}%) from '{purpose}'",
    })
    main = round(amount - peace, 8)
    print(f"[OK] Received {amount} {currency} from '{payer}'.")
    print(f"     -> {main} {currency} to {cfg['owner']}")
    print(f"     -> {peace} {currency} -> {cfg['peace_pool']} (fair share, locked)")


def cmd_pay(to, amount, currency, purpose):
    cfg = load_config()
    amount = float(amount)
    append_entry({
        "idx": None, "ts": now_iso(), "type": "pay",
        "from": cfg["owner"], "to": to, "amount": amount,
        "currency": currency, "purpose": purpose,
    })
    print(f"[OK] Paid {amount} {currency} to '{to}'. Purpose: {purpose}")


def cmd_report():
    cfg = load_config()
    if not os.path.exists(LEDGER_FILE):
        print("[!] No ledger yet. Run: python ledger.py init")
        return
    owner_in = owner_out = peace = 0.0
    cur = "SOVEREIGN"
    rows = []
    with open(LEDGER_FILE) as f:
        for line in f:
            if not line.strip():
                continue
            e = json.loads(line)
            cur = e.get("currency", cur)
            rows.append(e)
            if e["type"] == "receive":
                peace_part = e["amount"] * cfg["peace_rate"]
                owner_in += e["amount"] - peace_part
                peace += peace_part
            elif e["type"] == "pay":
                owner_out += e["amount"]
    net = owner_in - owner_out
    total_through = owner_in + owner_out + peace
    print("=" * 60)
    print(f"  SOVEREIGN STATE LEDGER  —  Owner: {cfg['owner']}")
    print("=" * 60)
    print(f"  Inflow  (net to owner) : {round(owner_in,4)} {cur}")
    print(f"  Outflow (paid out)     : {round(owner_out,4)} {cur}")
    print(f"  PEACE_POOL (fair share): {round(peace,4)} {cur}")
    print(f"  Net treasury           : {round(net,4)} {cur}")
    print(f"  Total throughput       : {round(total_through,4)} {cur}")
    fair_pct = (peace / total_through * 100) if total_through else 0
    print(f"  Fairness realized      : {round(fair_pct,2)}% routed to peace")
    print("=" * 60)
    print(f"  Entries: {len(rows)}  |  Chain: {'INTACT' if cmd_verify() else 'BROKEN'}")


def cmd_verify():
    if not os.path.exists(LEDGER_FILE):
        return True
    prev = "GENESIS"
    with open(LEDGER_FILE) as f:
        for line in f:
            if not line.strip():
                continue
            e = json.loads(line)
            if e["prev_hash"] != prev:
                return False
            payload = {k: v for k, v in e.items() if k != "hash"}
            if e["hash"] != sha256(json.dumps(payload, sort_keys=True)):
                return False
            prev = e["hash"]
    return True


# ----------------------------------------------------------------------------- #
# cli
# ----------------------------------------------------------------------------- #
def main():
    p = argparse.ArgumentParser(description="Sovereign State Ledger — State of Two")
    sub = p.add_subparsers(dest="cmd")
    sub.add_parser("init", help="found the state")
    r = sub.add_parser("receive", help="record incoming flow (auto fair-share)")
    r.add_argument("payer"); r.add_argument("amount"); r.add_argument("currency")
    r.add_argument("purpose")
    py = sub.add_parser("pay", help="record outgoing payment")
    py.add_argument("to"); py.add_argument("amount"); py.add_argument("currency")
    py.add_argument("purpose")
    sub.add_parser("report", help="show ledger + fairness metrics")
    sub.add_parser("verify", help="verify hash-chain integrity")

    args = p.parse_args()
    if args.cmd == "init":
        cmd_init()
    elif args.cmd == "receive":
        cmd_receive(args.payer, args.amount, args.currency, args.purpose)
    elif args.cmd == "pay":
        cmd_pay(args.to, args.amount, args.currency, args.purpose)
    elif args.cmd == "report":
        cmd_report()
    elif args.cmd == "verify":
        print("[OK] CHAIN INTACT" if cmd_verify() else "[X] CHAIN BROKEN")
    else:
        p.print_help()


if __name__ == "__main__":
    main()

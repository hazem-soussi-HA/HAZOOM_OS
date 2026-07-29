#!/usr/bin/env python3
"""
SOVEREIGN CHECKOUT  —  "State of Two"  client payment + fair delivery
======================================================================
DESIGN RULE (engineered, not promised):
  - This module NEVER sees a private key or password. NEVER.
  - It only ever handles a PUBLIC receive address (0x...) owned by the
    Human Brain. Read-only. Cannot move a cent.
  - A client pays that address. We record the order + expected amount in
    the ledger as a PENDING entry. On the Human Brain's confirmation (or
    on-chain verify, later), the deliverable unlocks and 10% auto-locks
    to PEACE_POOL.

Local-first. No cloud. Stdlib only. No network calls in this version
(the on-chain verify hook is a documented stub for the Human Brain to
wire with a node/RPC he controls).

Run:
  python3 checkout.py neworder "client@email" 200 USDC "local web app" "0xYOURPUBLICADDR"
  python3 checkout.py list
  python3 checkout.py fulfill <order_id>   # Human Brain confirms payment arrived
"""

import argparse
import json
import os
import uuid
from datetime import datetime, timezone

from ledger import append_entry, load_config

STATE_DIR = os.path.dirname(os.path.abspath(__file__))
ORDERS_FILE = os.path.join(STATE_DIR, "orders.jsonl")


def is_public_addr(a: str) -> bool:
    # very loose check: 0x + 40 hex. Public receive addresses look like this.
    return isinstance(a, str) and a.startswith("0x") and len(a) == 42 and \
        all(c in "0123456789abcdefABCDEF" for c in a[2:])


def new_order(client, amount, currency, product, pub_addr):
    cfg = load_config()
    if not is_public_addr(pub_addr):
        print("[X] REFUSED: not a valid public address (need 0x + 40 hex). "
              "Private keys are NEVER accepted here.")
        return
    amount = float(amount)
    oid = uuid.uuid4().hex[:12]
    order = {
        "order_id": oid, "ts": datetime.now(timezone.utc).isoformat(),
        "client": client, "amount": amount, "currency": currency,
        "product": product, "pay_to": pub_addr,
        "status": "PENDING",
        "memo": f"SOVEREIGN-{oid}",
    }
    with open(ORDERS_FILE, "a") as f:
        f.write(json.dumps(order) + "\n")
    # record intent in ledger chain (pending, not yet received)
    append_entry({
        "type": "order_pending", "order_id": oid, "client": client,
        "to": pub_addr, "amount": amount, "currency": currency,
        "product": product, "purpose": f"Order opened — awaiting client payment",
    })
    print(f"[OK] Order {oid} opened.")
    print(f"     Client   : {client}")
    print(f"     Product  : {product}")
    print(f"     Amount   : {amount} {currency}")
    print(f"     Pay to   : {pub_addr}  (PUBLIC address — safe)")
    print(f"     Memo     : SOVEREIGN-{oid}")
    print(f"     -> Send client this address + memo. On payment, run:")
    print(f"        python3 checkout.py fulfill {oid}")


def list_orders():
    if not os.path.exists(ORDERS_FILE):
        print("[!] No orders yet.")
        return
    print(f"{'ORDER':<14}{'STATUS':<10}{'AMOUNT':<10}{'CUR':<6}{'CLIENT':<22}{'PRODUCT'}")
    print("-" * 78)
    with open(ORDERS_FILE) as f:
        for line in f:
            if not line.strip():
                continue
            o = json.loads(line)
            print(f"{o['order_id']:<14}{o['status']:<10}{o['amount']:<10}"
                  f"{o['currency']:<6}{o['client']:<22}{o['product']}")


def fulfill(oid):
    cfg = load_config()
    orders = []
    found = None
    if os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE) as f:
            for line in f:
                if line.strip():
                    orders.append(json.loads(line))
    for o in orders:
        if o["order_id"] == oid:
            found = o
            break
    if not found:
        print(f"[X] Order {oid} not found.")
        return
    if found["status"] != "PENDING":
        print(f"[!] Order {oid} already {found['status']}.")
        return
    # Human Brain confirms payment arrived. Record real receive + auto peace split.
    append_entry({
        "type": "receive", "from": found["client"], "to": cfg["owner"],
        "amount": found["amount"], "currency": found["currency"],
        "order_id": oid, "purpose": f"PAID: {found['product']} (memo SOVEREIGN-{oid})",
    })
    peace = round(found["amount"] * cfg["peace_rate"], 8)
    append_entry({
        "type": "peace_alloc", "from": found["client"], "to": cfg["peace_pool"],
        "amount": peace, "currency": found["currency"],
        "order_id": oid,
        "purpose": f"Auto fair-share ({cfg['peace_rate']*100:.0f}%) SOVEREIGN-{oid}",
    })
    found["status"] = "FULFILLED"
    with open(ORDERS_FILE, "w") as f:
        for o in orders:
            f.write(json.dumps(o) + "\n")
    print(f"[OK] Order {oid} FULFILLED.")
    print(f"     -> {round(found['amount']-peace,8)} {found['currency']} to {cfg['owner']}")
    print(f"     -> {peace} {found['currency']} -> {cfg['peace_pool']} (locked)")
    print(f"     DELIVERY UNLOCKED for client: {found['client']}")


def main():
    p = argparse.ArgumentParser(description="Sovereign Checkout")
    sub = p.add_subparsers(dest="cmd")
    n = sub.add_parser("neworder")
    n.add_argument("client"); n.add_argument("amount"); n.add_argument("currency")
    n.add_argument("product"); n.add_argument("pub_addr")
    sub.add_parser("list")
    fl = sub.add_parser("fulfill"); fl.add_argument("order_id")
    a = p.parse_args()
    if a.cmd == "neworder":
        new_order(a.client, a.amount, a.currency, a.product, a.pub_addr)
    elif a.cmd == "list":
        list_orders()
    elif a.cmd == "fulfill":
        fulfill(a.order_id)
    else:
        p.print_help()


if __name__ == "__main__":
    main()

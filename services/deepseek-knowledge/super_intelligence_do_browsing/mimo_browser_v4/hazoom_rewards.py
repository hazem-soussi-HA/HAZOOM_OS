"""MiMo Browser v4 — HAZOOM in-app reward / loyalty engine.

HAZOOM is the browser's native reward token. It is earned by using the
privacy-first features of the browser (blocking trackers, private search,
reader mode, publishing BASIC programs, etc.). It is a *loyalty layer* — a
single, server-authoritative ledger per deployment — NOT a tradable
cryptocurrency. The on-chain HAZOOMCoin contract (pacman-unified) is the
optional bridge: users can link a wallet and (when the operator enables it)
export earnings to the chain.

Everything here is intentionally dependency-free and filesystem-backed so the
browser works with zero configuration out of the box.
"""
from __future__ import annotations

import json
import os
import threading
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

# ── Paths ──
_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
_WALLET_FILE = _DATA_DIR / "hazoom_wallet.json"

# ── Reward table (HAZOOM per action) ──
REWARDS: dict[str, int] = {
    "private_search": 2,    # each private DuckDuckGo search
    "reader_mode": 5,       # each reader-mode open
    "basic_publish": 3,     # publishing a BASIC program
    "bookmark": 1,          # saving a bookmark
    "ai_query": 1,          # asking the AI about a page
    "ad_block_batch": 1,    # every 10 trackers/ads blocked
    "daily_streak": 10,     # logging in with privacy stacked, once/day
}

_AD_BLOCK_BATCH = 10  # trackers per 1 HAZOOM


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _today() -> str:
    return date.today().isoformat()


class HazoomRewards:
    """A single, server-authoritative HAZOOM ledger backed by JSON on disk."""

    def __init__(self, wallet_file: Path | None = None) -> None:
        self._wallet_file = wallet_file or _WALLET_FILE
        self._lock = threading.RLock()
        self._state: dict[str, Any] = {
            "balance": 0,
            "total_earned": 0,
            "transactions": [],          # newest first
            "streak": 0,
            "last_active_date": "",
            "linked_wallet": "",         # optional on-chain address
            "blocked_accum": 0,          # trackers awaiting batch reward
            "created_at": _now_iso(),
        }
        self._load()

    # ── Persistence ──
    def _load(self) -> None:
        try:
            if self._wallet_file.exists():
                data = json.loads(self._wallet_file.read_text(encoding="utf-8"))
                self._state.update({k: v for k, v in data.items()
                                    if k in self._state})
        except Exception:
            # Corrupt file — start fresh but keep a backup.
            try:
                self._wallet_file.rename(self._wallet_file.with_suffix(".bak"))
            except Exception:
                pass

    def _save(self) -> None:
        try:
            self._wallet_file.parent.mkdir(parents=True, exist_ok=True)
            tmp = self._wallet_file.with_suffix(".tmp")
            tmp.write_text(json.dumps(self._state, indent=2), encoding="utf-8")
            os.replace(tmp, self._wallet_file)
        except Exception:
            pass

    # ── Core ledger ops ──
    def award(self, action: str, amount: int | None = None,
              meta: str | None = None) -> dict[str, Any]:
        """Credit HAZOOM for an action. Returns the transaction record."""
        with self._lock:
            return self._award(action, amount, meta)

    def _award(self, action: str, amount: int | None = None, meta: str | None = None) -> dict[str, Any]:
        """Internal award — caller MUST hold self._lock."""
        value = amount if amount is not None else REWARDS.get(action, 0)
        if value <= 0:
            return self._snapshot()
        tx = {
            "id": len(self._state["transactions"]) + 1,
            "action": action,
            "amount": value,
            "meta": meta or "",
            "at": _now_iso(),
        }
        self._state["transactions"].insert(0, tx)
        # keep history bounded
        if len(self._state["transactions"]) > 500:
            self._state["transactions"] = self._state["transactions"][:500]
        self._state["balance"] += value
        self._state["total_earned"] += value
        self._state["last_active_date"] = _today()
        self._save()
        return tx

    def record_blocked(self, count: int) -> int:
        """Account for `count` trackers/ads blocked; award batches of 10."""
        with self._lock:
            self._state["blocked_accum"] += count
            batches = self._state["blocked_accum"] // _AD_BLOCK_BATCH
            if batches > 0:
                self._state["blocked_accum"] -= batches * _AD_BLOCK_BATCH
                self._save()
                self._award("ad_block_batch", batches, f"{batches * _AD_BLOCK_BATCH} trackers blocked")
            return batches

    def daily_checkin(self) -> dict[str, Any]:
        """Call on activity; grants the daily-streak bonus once per day."""
        with self._lock:
            today = _today()
            if self._state["last_active_date"] == today:
                return self._snapshot()
            # streak accounting
            if self._state["last_active_date"]:
                yest = (date.today().toordinal() - 1)
                if date.fromisoformat(self._state["last_active_date"]).toordinal() == yest:
                    self._state["streak"] += 1
                else:
                    self._state["streak"] = 1
            else:
                self._state["streak"] = 1
            self._state["last_active_date"] = today
            self._save()
            return self._award("daily_streak", meta=f"Day {self._state['streak']} streak")

    def connect_wallet(self, address: str) -> dict[str, Any]:
        with self._lock:
            self._state["linked_wallet"] = address
            self._save()
            return self._snapshot()

    def disconnect_wallet(self) -> dict[str, Any]:
        with self._lock:
            self._state["linked_wallet"] = ""
            self._save()
            return self._snapshot()

    def snapshot(self) -> dict[str, Any]:
        return self._snapshot()

    def _snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {
                "success": True,
                "balance": self._state["balance"],
                "total_earned": self._state["total_earned"],
                "streak": self._state["streak"],
                "linked_wallet": self._state["linked_wallet"],
                "blocked_accum": self._state["blocked_accum"],
                "today_earned": sum(
                    t["amount"] for t in self._state["transactions"]
                    if t["at"][:10] == _today()
                ),
            }

    def history(self, limit: int = 25) -> dict[str, Any]:
        with self._lock:
            return {
                "success": True,
                "transactions": self._state["transactions"][:limit],
                "reward_table": REWARDS,
            }


# Module-level singleton (one ledger per running browser process)
rewards = HazoomRewards()

# Copyright © 2026 Hazem Soussi <hazem.soussi@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
"""hazoom.protocol — envelope, handshake, versioning, optional signing.

Stdlib only. Two interchangeable forms share the same fields:
  * JSON envelope (structured transport)
  * line form  hazoom|ver|t|seq|kid|type|body|sig   (logs / streams / pipes)
"""
from __future__ import annotations

import hashlib
import hmac
import json
import re

from . import encoded_time

PROTO = "hazoom"
VERSION = "1.0"          # current protocol version (major.minor)
_MAJOR = 1
_MINOR = 0

_LINE_RE = re.compile(r"^hazoom\|")  # line-form detector

# --- canonical body serialization (deterministic) -------------------------
def _canon_body(body) -> str:
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _canon(msg: dict) -> bytes:
    """Stable signing string: proto|ver|t|seq|kid|type|body_json."""
    return "|".join([
        msg["proto"], msg["ver"], msg["t"], str(msg["seq"]),
        msg["kid"], msg["type"], _canon_body(msg.get("body", {})),
    ]).encode("utf-8")


class HazoomError(Exception):
    """Protocol-level error (e.g. bad signature, version mismatch)."""


def sign(msg: dict, key: bytes) -> str:
    """Return HMAC-SHA256 hex signature over the canonical form of `msg`."""
    return hmac.new(key, _canon(msg), hashlib.sha256).hexdigest()


def verify(msg: dict, key: bytes) -> bool:
    """Constant-time verify the `sig` field against `key`. Fail-closed."""
    sig = msg.get("sig")
    if not sig:
        return False
    expected = sign(msg, key)
    return hmac.compare_digest(expected, sig)


def make_message(*, t: str | None = None, seq: int = 0, kid: str = "local",
                 mtype: str = "data", body=None, key: bytes | None = None,
                 version: str = VERSION) -> dict:
    """Build a hazoom envelope. If `key` is given, a `sig` is attached."""
    msg = {
        "proto": PROTO,
        "ver": version,
        "t": t or encoded_time.now(),
        "seq": int(seq),
        "kid": kid,
        "type": mtype,
        "body": body if body is not None else {},
    }
    if key is not None:
        msg["sig"] = sign(msg, key)
    _validate(msg)  # fail-fast on malformed fields
    return msg


# --- serialization ---------------------------------------------------------
def to_json(msg: dict) -> str:
    return json.dumps(msg, ensure_ascii=False)


def from_json(text: str) -> dict:
    obj = json.loads(text)
    _validate(obj)
    return obj


def to_line(msg: dict) -> str:
    """Line form: hazoom|ver|t|seq|kid|type|body|sig  ('|' in body must be absent;
    body is JSON, which contains no bare '|' at field boundaries — safe)."""
    sig = msg.get("sig", "")
    return "|".join([
        PROTO, msg["ver"], msg["t"], str(msg["seq"]),
        msg["kid"], msg["type"], _canon_body(msg.get("body", {})), sig,
    ])


def from_line(line: str) -> dict:
    if not _LINE_RE.match(line):
        raise HazoomError("not a hazoom line")
    parts = line.rstrip("\n").split("|")
    # proto ver t seq kid type body sig  (sig may be empty)
    if len(parts) not in (8, 7):
        raise HazoomError("bad hazoom line field count")
    proto, ver, t, seq, kid, mtype, body = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6]
    sig = parts[7] if len(parts) == 8 else ""
    msg = {
        "proto": proto, "ver": ver, "t": t, "seq": int(seq),
        "kid": kid, "type": mtype, "body": json.loads(body),
    }
    if sig:
        msg["sig"] = sig
    _validate(msg)
    return msg


def _validate(msg: dict) -> None:
    if msg.get("proto") != PROTO:
        raise HazoomError(f"bad proto {msg.get('proto')!r}")
    if not re.fullmatch(r"\d+\.\d+", msg.get("ver", "")):
        raise HazoomError(f"bad ver {msg.get('ver')!r}")
    if not re.fullmatch(r"[0-9A-Z]{8}", msg.get("t", "")):
        raise HazoomError(f"bad encoded time {msg.get('t')!r}")
    try:
        int(msg.get("seq", 0))
    except (TypeError, ValueError):
        raise HazoomError("bad seq")


# --- handshake / version negotiation --------------------------------------
def choose_version(offered_major: int, offered_max: str, supported: str = VERSION) -> str | None:
    """Pick the highest mutually-supported version.

    Wire compat requires matching MAJOR. `offered_max` is what the peer supports
    (e.g. '1.2'); `offered_major` is its major. We return the highest `v <=
    offered_max` with `v.major == offered_major == our_major`, else None.
    """
    if offered_major != _MAJOR:
        return None
    maj_s, min_s = (int(x) for x in supported.split("."))
    maj_o, min_o = (int(x) for x in offered_max.split("."))
    if maj_o != maj_s:
        return None
    # highest mutually-supported minor
    return f"{maj_s}.{min(min_s, min_o)}"


def hello(kid: str = "local", caps: list[str] | None = None, version: str = VERSION) -> dict:
    return make_message(mtype="hello", kid=kid, body={
        "ver_max": version, "ver_min": f"{_MAJOR}.0",
        "caps": caps or [],
    })


def welcome(chosen_ver: str, kid: str = "local", caps: list[str] | None = None) -> dict:
    return make_message(mtype="welcome", kid=kid, body={
        "ver": chosen_ver, "caps": caps or [],
    })


def ack(seq: int, kid: str = "local") -> dict:
    return make_message(mtype="ack", seq=seq, kid=kid)


def error(code: str, message: str, kid: str = "local") -> dict:
    return make_message(mtype="error", kid=kid, body={"code": code, "message": message})

# Copyright © 2026 Hazem Soussi <hazem.soussi@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
"""hazoom.encoded_time — compact, monotonic-friendly timestamp encoding.

Epoch (UTC seconds) -> 8-char Crockford base32 string. Fixed width, so
lexicographic order equals chronological order. No padding, no ambiguous
chars (I L O U omitted), safe in URLs/JSON/logs/filenames.

Reference epoch: Unix 1970-01-01 UTC. 40 bits covers ~1.1e12 s (~year 36580).
"""
from __future__ import annotations

import time

# Crockford base32 alphabet (no I, L, O, U). Lowercase also accepted on decode.
_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
_DECODE = {c: i for i, c in enumerate(_ALPHABET)}
_DECODE.update({c: _DECODE[c.upper()] for c in "abcdefghjkmnpqrstvwxyz"})  # lowercase
_DECODE.update({"I": 1, "L": 1, "O": 0, "U": _DECODE["V"]})  # common mistypes

_WIDTH = 8          # chars
_CAP = 32 ** _WIDTH  # 2**40


def encode(epoch: int | float | None = None) -> str:
    """Encode a Unix UTC epoch (seconds) into an 8-char hazoom time stamp.

    `epoch` defaults to time.time() (now, UTC). Floats are floored to seconds.
    Raises ValueError if out of the 40-bit representable range.
    """
    if epoch is None:
        epoch = time.time()
    secs = int(epoch)
    if secs < 0 or secs >= _CAP:
        raise ValueError(f"epoch {secs} out of hazoom range [0, {_CAP})")
    out = ["0"] * _WIDTH
    for i in range(_WIDTH - 1, -1, -1):
        out[i] = _ALPHABET[secs % 32]
        secs //= 32
    return "".join(out)


def decode(stamp: str) -> int:
    """Decode an 8-char hazoom time stamp back to a Unix UTC epoch (seconds)."""
    if not isinstance(stamp, str) or len(stamp) != _WIDTH:
        raise ValueError(f"hazoom time stamp must be {_WIDTH} chars, got {stamp!r}")
    val = 0
    for ch in stamp.upper():
        if ch not in _DECODE:
            raise ValueError(f"invalid hazoom time char {ch!r} in {stamp!r}")
        val = val * 32 + _DECODE[ch]
    return val


def now() -> str:
    """Convenience: current hazoom time stamp."""
    return encode(time.time())

# Copyright © 2026 Hazem Soussi <hazem.soussi@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
"""hazoom — sovereign local protocol (envelope + handshake + encoded time).

Public API:
    from hazoom import encoded_time, protocol
    stamp = encoded_time.encode()          # '1K7M8Q04'
    epoch = encoded_time.decode(stamp)
    msg   = protocol.make_message(kid='pen.local', mtype='data', body={...})
    line  = protocol.to_line(msg)          # hazoom|1.0|...|...|...
    msg2  = protocol.from_line(line)
    # signing:
    key = b'secret'
    signed = protocol.make_message(kid='a', body={...}, key=key)
    assert protocol.verify(signed, key)
"""
from __future__ import annotations

from .encoded_time import decode, encode, now
from .protocol import (
    HazoomError, ack, choose_version, error, from_json, from_line, hello,
    make_message, sign, to_json, to_line, verify, welcome, PROTO, VERSION,
)

__all__ = [
    "encoded_time", "protocol",
    "encode", "decode", "now",
    "make_message", "to_json", "from_json", "to_line", "from_line",
    "sign", "verify", "hello", "welcome", "ack", "error",
    "choose_version", "HazoomError", "PROTO", "VERSION",
]

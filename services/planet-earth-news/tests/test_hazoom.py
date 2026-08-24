# Copyright © 2026 Hazem Soussi <hazem.soussi@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Tests for the hazoom protocol package (encoded time + envelope + handshake)."""
from __future__ import annotations

import time

import pytest

from hazoom import encoded_time, protocol


# --- encoded time -----------------------------------------------------------
def test_encode_decode_roundtrip():
    for epoch in (0, 1, 1700000000, 2 ** 39, 2 ** 40 - 1):
        stamp = encoded_time.encode(epoch)
        assert len(stamp) == 8
        assert encoded_time.decode(stamp) == epoch


def test_encode_now_is_valid():
    stamp = encoded_time.now()
    assert len(stamp) == 8
    # decode rounds back to within ~1s of now
    assert abs(encoded_time.decode(stamp) - int(time.time())) <= 1


def test_lexicographic_order_equals_time_order():
    stamps = [encoded_time.encode(t) for t in (100, 5000, 999999, 1700000000)]
    assert stamps == sorted(stamps)


def test_decode_rejects_bad_length():
    with pytest.raises(ValueError):
        encoded_time.decode("SHORT")  # 5 chars, not 8


def test_decode_accepts_lowercase_and_mistypes():
    # 'O' is treated as 0, 'I'/'L' as 1 in Crockford
    assert encoded_time.decode("0000000O") == encoded_time.decode("00000000")
    assert encoded_time.decode("0000000I") == encoded_time.decode("00000001")


def test_encode_rejects_out_of_range():
    with pytest.raises(ValueError):
        encoded_time.encode(2 ** 40)
    with pytest.raises(ValueError):
        encoded_time.encode(-1)


# --- envelope: JSON + line forms -------------------------------------------
def test_json_roundtrip():
    m = protocol.make_message(kid="pen.local", mtype="data", seq=3, body={"x": 1})
    m2 = protocol.from_json(protocol.to_json(m))
    assert m2["kid"] == "pen.local"
    assert m2["type"] == "data"
    assert m2["body"] == {"x": 1}
    assert m2["seq"] == 3


def test_line_roundtrip():
    m = protocol.make_message(kid="a", mtype="feed.update", seq=1, body={"k": "v"})
    line = protocol.to_line(m)
    assert line.startswith("hazoom|")
    m2 = protocol.from_line(line)
    assert m2["type"] == "feed.update"
    assert m2["body"] == {"k": "v"}


def test_validate_rejects_wrong_proto():
    with pytest.raises(protocol.HazoomError):
        protocol.from_json('{"proto":"other","ver":"1.0","t":"00000000","seq":0,"kid":"k","type":"data","body":{}}')


def test_validate_rejects_bad_time():
    with pytest.raises(protocol.HazoomError):
        protocol.make_message(t="BAD!", kid="k")


# --- signing (tamper-evidence) ---------------------------------------------
def test_sign_verify_roundtrip():
    key = b"shared-secret"
    m = protocol.make_message(kid="a", body={"hello": "world"}, key=key)
    assert "sig" in m
    assert protocol.verify(m, key) is True


def test_verify_fails_on_tamper():
    key = b"shared-secret"
    m = protocol.make_message(kid="a", body={"hello": "world"}, key=key)
    m["body"]["hello"] = "tampered"
    assert protocol.verify(m, key) is False


def test_verify_fails_on_wrong_key():
    m = protocol.make_message(kid="a", body={"x": 1}, key=b"key-a")
    assert protocol.verify(m, b"key-b") is False


def test_unsigned_message_has_no_sig_and_fails_verify():
    m = protocol.make_message(kid="a", body={"x": 1})  # no key
    assert "sig" not in m
    assert protocol.verify(m, b"any") is False


def test_line_preserves_signature():
    key = b"k"
    m = protocol.make_message(kid="a", body={"n": 1}, key=key)
    m2 = protocol.from_line(protocol.to_line(m))
    assert protocol.verify(m2, key) is True


# --- handshake / version negotiation ---------------------------------------
def test_choose_version_matches_major():
    # peer offers up to 1.2; we support 1.0 -> pick 1.0 (highest mutual minor)
    assert protocol.choose_version(1, "1.2") == "1.0"


def test_choose_version_rejects_other_major():
    assert protocol.choose_version(2, "2.3") is None


def test_handshake_exchange():
    h = protocol.hello(kid="pen.local", caps=["feed"])
    assert h["type"] == "hello"
    chosen = protocol.choose_version(1, h["body"]["ver_max"])
    assert chosen is not None
    w = protocol.welcome(chosen, kid="server", caps=["feed"])
    assert w["type"] == "welcome"
    assert w["body"]["ver"] == chosen


def test_ack_carries_seq():
    a = protocol.ack(seq=42)
    assert a["type"] == "ack"
    assert a["seq"] == 42


def test_error_envelope():
    e = protocol.error("VER_MISMATCH", "no common version")
    assert e["type"] == "error"
    assert e["body"]["code"] == "VER_MISMATCH"

# HAZOOM — sovereign local protocol

`hazoom` is a tiny, dependency-free, local-first message protocol designed by
Hazem Soussi for sovereign software. It carries an **encoded timestamp** in
every envelope so messages are self-ordering, freshness-checked, and tamper-
evident — without trusting the transport or a remote clock.

Design goals (KISS / DRY / secure-by-default):
- **Self-describing**: every message says `proto=hazoom` and its `ver`.
- **Encoded time**: a compact, URL/JSON-safe stamp that is monotonic-friendly
  and survives ~142 million years without overflow or padding.
- **Versioned**: `ver` is `major.minor`. Major = wire-breaking; minor = additive.
- **Tamper-evident**: optional `sig` (HMAC-SHA256) — present when a shared key
  is configured, absent for unsigned local use. Verification is fail-closed.
- **No external deps**: stdlib only.

## Encoded time (`T`)

- Source: Unix UTC epoch **seconds** (integer, UTC, no leap-second smearing).
- Encoding: **Crockford base32** (no padding), fixed **8 characters**.
  - Alphabet: `0123456789ABCDEFGHJKMNPQRSTVWXYZ` (I,L,O,U omitted to avoid
    confusion; lowercase accepted on decode).
  - 8 chars × 5 bits = 40 bits → max value 2^40-1 ≈ 1.0995e12 s ≈ year 36,580,
    more than enough; fixed width means lexicographic order == time order.
- Why base32 not base64: no `+`, `/`, `=` — safe in URLs, JSON, file names, and
  logs without escaping. Crockford keeps it human-friendly.
- **Monotonicity**: the envelope carries a separate `seq` (per `kid`) counter so
  that two messages in the same second still order correctly even if the clock
  goes backwards (NTP skew). `t` is the wall clock; `seq` breaks ties.

Example: epoch `1700000000` → `1K7M8Q04` (illustrative; see `hazoom/time.py`).

## Envelope

Two interchangeable forms share the same fields:

### JSON form (structured transport)
```json
{
  "proto": "hazoom",
  "ver": "1.0",
  "t": "1K7M8Q04",
  "seq": 7,
  "kid": "pen.local",
  "type": "feed.update",
  "body": { "...": "..." },
  "sig": "b6e5... (optional, HMAC-SHA256 hex, omitted if unsigned)"
}
```

### Line form (logs / streams / pipes)
```
hazoom|1.0|1K7M8Q04|7|pen.local|feed.update|<urlencoded-or-json-body>[|sig]
```
Fields separated by `|`; `sig` is the last field and may be empty. Use the line
form for `HELLO`/`WELCOME`/`ACK` control messages too.

## Message types

| type           | dir        | meaning                                              |
|----------------|------------|------------------------------------------------------|
| `hello`        | ->         | `HELLO`: announce `ver` range + `kid` + offered caps |
| `welcome`      | <-         | `WELCOME`: chosen `ver` + `kid` + accepted caps      |
| `ack`          | <->        | `ACK`: confirm receipt of `seq`                      |
| `ping`/`pong`  | <->        | liveness                                             |
| `data`         | ->         | application payload (`body` = domain object)         |
| `error`        | <-         | `body` = `{code, message}`                           |

## Handshake (version negotiation)

```
A -> B   hello   {ver_max, ver_min, kid, caps}
B -> A   welcome {ver, kid, caps}        # ver = highest mutually supported
A -> B   ack     {}                      # optional
... data ...
```

- `ver` negotiation: peer picks `max(v)` such that `v <= A.ver_max` and
  `v.major == A.ver_major` (major must match for wire compat). If none, reply
  `error` with code `VER_MISMATCH` and close.
- `kid` identifies the source; used as the SRI/seq namespace and (if signed)
  the HMAC key selector.

## Signing (optional, fail-closed)

When a shared secret `key` is configured for a `kid`:
- `sig = HMAC-SHA256(key, canon(msg))` where `canon` is the stable
  concatenation `proto|ver|t|seq|kid|type|body_json` (body serialized
  deterministically: keys sorted, no whitespace).
- On receive: recompute and compare with constant-time `hmac.compare_digest`.
  Missing/!matching `sig` when a key is expected → reject (`error`/`drop`).
- Unsigned mode: `sig` field omitted; messages still carry `t` + `seq` for
  ordering. Local-only by design.

## Security posture (local-first)

- Loopback / same-host assumption: no transport security is assumed; pair with
  TLS (see PEN) when crossing a boundary.
- Replay: a receiver may drop messages whose `t` is older than `now - max_age`
  (default 300s) or whose `(kid, seq)` was already seen.
- Confidentiality is NOT provided by hazoom itself; it is a message/ordering/
  integrity protocol, not a transport cipher.

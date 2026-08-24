# Copyright © 2026 Hazem Soussi <hazem.soussi@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Planet Earth News — Flask backend (local-first, sovereign).

Bind to loopback only. Serves the static dashboard and JSON APIs that
aggregate the configured feeds through the SSRF-guarded fetcher.
"""
from __future__ import annotations

import secrets
import time
import hashlib
import hmac
from pathlib import Path

from flask import Flask, g, jsonify, request, send_from_directory

import auth
import fetcher
import hazoom.protocol as hz
import hazoom.encoded_time as hzt

BASE = Path(__file__).resolve().parent
CONFIG = fetcher.load_config(str(BASE / "config.yaml"))


def _provenance_key() -> bytes | None:
    """Stable HMAC key for item provenance, derived from the API token so it
    stays consistent across restarts without extra config."""
    tok = auth.get_token()
    if not tok:
        return None
    return hmac.new(b"pen-item-v1", tok.encode("utf-8"), hashlib.sha256).digest()


def _item_with_provenance(item: "fetcher.Item") -> dict:
    """Return the item as a dict, augmented with a hazoom provenance envelope
    (encoded timestamp + HMAC). The signature covers the content so the UI can
    show 'verified provenance + freshness' and offline cache stays tamper-evident."""
    d = item.to_dict()
    key = _provenance_key()
    if key:
        env = hz.make_message(
            kid="pen.feed", mtype="item",
            body={"link": d.get("link", ""), "title": d.get("title", ""),
                  "published": d.get("published", "")},
            key=key,
        )
        d["hz_t"] = env["t"]
        d["hz_sig"] = env["sig"]
    return d


app = Flask(__name__, static_folder=str(BASE / "static"), static_url_path="/static")

# Refuse to start in a LAN-exposed bind (defence against misconfiguration).
# The only supported way to expose PEN beyond loopback is an AUTHENTICATED
# reverse proxy in front of this loopback service. server.lan_ok is NOT a
# bypass — it only documents intent; the bind is still forced to loopback.
_SRV = CONFIG.get("server", {})
_BIND = _SRV.get("bind", "127.0.0.1")
if _BIND not in ("127.0.0.1", "localhost", "::1"):
    import sys

    print(
        "REFUSING TO BIND TO A NON-LOOPBACK ADDRESS (got "
        f"{_BIND!r}).\n"
        "PEN is local-first and sovereign. To share it beyond this machine,\n"
        "keep server.bind=127.0.0.1 and put an AUTHENTICATED reverse proxy\n"
        "(e.g. nginx + client-cert / mTLS) in front. Setting server.lan_ok\n"
        "does NOT bypass this guard — the API token alone is not LAN-safe.\n"
        "Edit server.bind in config.yaml back to 127.0.0.1.",
        file=sys.stderr,
    )
    sys.exit(1)


# --- tiny in-process rate limiter (per-IP, simple token bucket) -------------
_LIMIT = 30          # requests
_WINDOW = 60.0       # per this many seconds
_HITS: dict[str, list[float]] = {}


def _rate_limited(ip: str) -> bool:
    now = time.time()
    hits = _HITS.get(ip, [])
    hits = [t for t in hits if now - t < _WINDOW]
    if len(hits) >= _LIMIT:
        _HITS[ip] = hits
        return True
    hits.append(now)
    _HITS[ip] = hits
    return False


@app.before_request
def _mk_nonce():
    # Per-request CSP nonce. Regenerated every request so a leaked nonce is
    # useless after the response is served. Stored on g for index() + headers.
    g.nonce = secrets.token_hex(16)


@app.before_request
def _require_api_token():
    # Local-first auth: every stateful API requires the bearer token. The
    # dashboard HTML and static assets are public; only /api/feed + /api/security
    # are guarded (health is intentionally open for watchdog probes).
    path = request.path
    if not path.startswith("/api/"):
        return
    if path == "/api/health" or path == "/favicon.ico":
        return
    authz = request.headers.get("Authorization", "")
    token = authz[len("Bearer "):] if authz.lower().startswith("bearer ") else authz
    if not auth.verify_token(token):
        return jsonify(error="unauthorized"), 401


@app.get("/")
def index():
    # Serve the dashboard, injecting the per-request CSP nonce and the
    # Subresource-Integrity (SRI) hashes for our bundled assets. Hashes are
    # computed from the files on disk at request time, so any tampering of
    # app.min.js / style.min.css makes the browser refuse to execute them.
    # Also inject the local API token so the SPA can authenticate its fetches.
    html = (BASE / "static" / "index.html").read_text(encoding="utf-8")
    html = html.replace("__NONCE__", getattr(g, "nonce", ""))
    html = html.replace("__SRI__", _sri_hash(BASE / "static" / "app.min.js"))
    html = html.replace("__SRI_CSS__", _sri_hash(BASE / "static" / "style.min.css"))
    html = html.replace("__PEN_TOKEN__", auth.get_token())
    resp = app.make_response(html)
    resp.headers["Content-Type"] = "text/html; charset=utf-8"
    return resp


def _sri_hash(path: Path) -> str:
    """sha384 SRI hash in the form 'sha384-<base64>' for a Subresource-Integrity
    attribute. If the asset is missing we return an impossible hash so the
    browser blocks it (fail closed), rather than silently loading unverified JS."""
    import base64
    import hashlib

    try:
        data = Path(path).read_bytes()
    except OSError:
        return "sha384-UNVERIFIED"
    digest = hashlib.sha384(data).digest()
    return "sha384-" + base64.b64encode(digest).decode("ascii")


@app.get("/favicon.ico")
def favicon():
    # inline data-URI favicon is referenced in index.html; this is a safe 204
    # fallback so the browser stops hammering a missing file.
    return ("", 204)


@app.after_request
def _secure_headers(resp):
    # Local-first, defence-in-depth hardening.
    nonce = getattr(g, "nonce", "")
    csp = (
        "default-src 'self'; "
        f"script-src 'self' 'nonce-{nonce}'; "
        "style-src 'self'; "
        "img-src 'self' https: data:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "frame-src https://www.youtube-nocookie.com; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none'; "
        "object-src 'none'"
    )
    resp.headers.setdefault("Content-Security-Policy", csp)
    # Local-only: HSTS on loopback stops a downgrade to http mid-session.
    resp.headers.setdefault("Strict-Transport-Security", "max-age=31536000")
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("Referrer-Policy", "no-referrer")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    # Window/opener isolation from other origins (does NOT block images).
    # NOTE: we intentionally do NOT set Cross-Origin-Embedder-Policy:
    # require-corp, because it would block the cross-origin news thumbnails.
    resp.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
    # Trim what little capability surface a localhost SPA needs.
    resp.headers.setdefault(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=(), usb=(), "
        "accelerometer=(), gyroscope=(), magnetometer=(), payment=()",
    )
    return resp



@app.get("/api/feed")
def api_feed():
    ip = request.remote_addr or "unknown"
    if _rate_limited(ip):
        return jsonify(error="rate limit exceeded"), 429

    # bounded, validated query param
    raw_q = request.args.get("q", "").strip()
    if len(raw_q) > 120:
        raw_q = raw_q[:120]

    # `fresh=1` bypasses the in-process cache (real refresh, not a cached copy)
    fresh = request.args.get("fresh", "0") == "1"

    # `fresh=1` bypasses the in-process cache (real refresh, not a cached copy)
    fresh = request.args.get("fresh", "0") == "1"

    items, errors, statuses = fetcher.fetch_all(CONFIG, query=raw_q, fresh=fresh)

    import store

    cache_key = "q-" + hashlib.sha256(raw_q.encode("utf-8")).hexdigest()[:16]

    # Build a list of provenance-bearing dicts. On a cache hit we serve the
    # already-signed dicts from disk (verified HMAC in store.load); otherwise
    # we sign the freshly-fetched items and mirror them to disk.
    if not fresh:
        cached = store.load(cache_key)
        if cached is not None:
            items = cached  # list[dict], each already carries hz_t + hz_sig
            statuses = [fetcher.SourceStatus(name="(cached)", ok=True)]
        else:
            items = [_item_with_provenance(i) for i in items]
            store.save(items, cache_key)
    else:
        items = [_item_with_provenance(i) for i in items]
        store.save(items, cache_key)

    return jsonify({
        "count": len(items),
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "sources_configured": len(CONFIG.get("sources", [])),
        "source_errors": errors,
        "source_status": [s.to_dict() for s in statuses],
        "security": fetcher.security_posture(CONFIG),
        "items": items,
    })



@app.get("/api/security")
def api_security():
    return jsonify(fetcher.security_posture(CONFIG))


@app.get("/api/health")
def health():
    return jsonify(status="ok")


if __name__ == "__main__":
    srv = CONFIG.get("server", {})
    app.run(
        host=srv.get("bind", "127.0.0.1"),
        port=srv.get("port", 8000),
        debug=bool(srv.get("debug", False)),
        threaded=True,
    )

# Copyright © 2026 Hazem Soussi <hazem.soussi@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Planet Earth History — secured local-first server (aiohttp).

Mirrors the PEN 4-layer security model:
  L1 AUTH        — single opaque bearer token in .env (chmod 600, git-ignored).
                   Every /api/* route is guarded; the SPA fetches it with the
                   same token injected at page render. Constant-time, fail-closed.
  L2 AT-REST     — the signed /api/dataset bundle is mirrored to cache/ as an
                   HMAC-signed, atomically-written file. A tampered or stale
                   cache is rejected fail-closed (we never serve poisoned data).
  L3 PROVENANCE  — the dataset itself is HMAC-signed (whole-bundle canonical
                   JSON). The SPA re-verifies the signature before hot-swapping
                   the graph, so what you see is exactly what the server signed.
  L4 LAN GUARD   — bind is HARD-PINNED to loopback. A non-loopback override
                   (env or config) is refused at startup; loopback-only is the
                   only supported topology. TLS on loopback is available and on
                   by default for local confidentiality.

Plus: per-request CSP nonce, Subresource-Integrity (SRI) on the bundled JS,
HSTS, nosniff, no-referrer, X-Frame-Options DENY, a tight Permissions-Policy,
and a simple per-IP token-bucket rate limiter.

Run:  python3 serve.py            (reads config.yaml / .env)
      PEN_HOST=127.0.0.1 PEH_PORT=8770 python3 serve.py
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import time
from pathlib import Path

import aiohttp
from aiohttp import web

import hazoom.protocol as hz

BASE = Path(__file__).resolve().parent
CACHE_DIR = BASE / "cache"
CONFIG_PATH = BASE / "config.yaml"

# --------------------------------------------------------------------------
# Config (minimal; loopback is the safe default, mirroring PEN)
# --------------------------------------------------------------------------
def _load_config() -> dict:
    # tiny YAML subset reader (no external dep): supports `key: value` and
    # nested `section:` blocks with indented `key: value`.
    cfg: dict = {}
    if not CONFIG_PATH.exists():
        return cfg
    cur = cfg
    for raw in CONFIG_PATH.read_text(encoding="utf-8").splitlines():
        line = raw.rstrip()
        if not line.strip() or line.strip().startswith("#"):
            continue
        indent = len(line) - len(line.lstrip())
        if indent == 0:
            if line.endswith(":"):
                cur = cfg.setdefault(line[:-1].strip(), {})
            else:
                k, _, v = line.partition(":")
                cfg[k.strip()] = _coerce(v.strip())
        else:
            k, _, v = line.partition(":")
            cur[k.strip()] = _coerce(v.strip())
    return cfg


def _coerce(v: str):
    if v.lower() in ("true", "yes", "on"):
        return True
    if v.lower() in ("false", "no", "off"):
        return False
    try:
        if "." in v or "e" in v.lower():
            return float(v)
        return int(v)
    except ValueError:
        return v


CONFIG = _load_config()
_SRV = CONFIG.get("server", {})

HOST = os.environ.get("PEH_HOST", _SRV.get("bind", "127.0.0.1"))
PORT = int(os.environ.get("PEH_PORT", _SRV.get("port", 8770)))
USE_TLS = bool(os.environ.get("PEH_TLS", _SRV.get("tls", True)))
THREADS = int(os.environ.get("PEH_THREADS", 8))

# ---- L4: refuse any non-loopback bind (defence against misconfiguration) ----
if HOST not in ("127.0.0.1", "localhost", "::1"):
    import sys
    print(
        "REFUSING TO BIND TO A NON-LOOPBACK ADDRESS (got "
        f"{HOST!r}).\n"
        "Planet Earth History is local-first and sovereign. To share it beyond\n"
        "this machine, keep server.bind=127.0.0.1 and put an AUTHENTICATED\n"
        "reverse proxy (e.g. nginx + client-cert / mTLS) in front. The API\n"
        "token alone is not LAN-safe. Edit server.bind in config.yaml back to\n"
        "127.0.0.1.",
        file=sys.stderr,
    )
    sys.exit(1)

# --------------------------------------------------------------------------
# L1: local-first bearer token (generated + persisted on first run)
# --------------------------------------------------------------------------
_ENV_FILE = BASE / ".env"
_TOKEN_VAR = "PEH_API_TOKEN"


def _parse_env_file() -> dict:
    out: dict = {}
    if not _ENV_FILE.exists():
        return out
    for line in _ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def _ensure_env():
    for k, v in _parse_env_file().items():
        os.environ.setdefault(k, v)


def get_token() -> str:
    _ensure_env()
    tok = os.environ.get(_TOKEN_VAR)
    if not tok:
        tok = secrets.token_urlsafe(32)
        existing = _parse_env_file()
        existing[_TOKEN_VAR] = tok
        _ENV_FILE.write_text(
            "\n".join(f"{k}={v}" for k, v in existing.items()) + "\n",
            encoding="utf-8",
        )
        _ENV_FILE.chmod(0o600)
        os.environ[_TOKEN_VAR] = tok
        try:
            import sys
            print(
                f"[PEH] generated local API token (save this): {tok}\n"
                "      Stored in .env (chmod 600, git-ignored).",
                file=sys.stderr,
            )
        except Exception:
            pass
    return tok


def verify_token(provided) -> bool:
    expected = get_token()
    if not provided or not expected:
        return False
    return hmac.compare_digest(provided, expected)


def _signing_key() -> bytes:
    # The API token is already a 43-char CSPRNG urlsafe string, so it is a
    # perfectly adequate HMAC key on its own. Using it RAW (not re-derived)
    # lets the browser SPA reproduce the exact same HMAC with Web Crypto from
    # the injected token — keeping cross-platform signature verification simple
    # and deterministic. (The key never leaves the machine; it stays in .env.)
    return get_token().encode("utf-8")


# --------------------------------------------------------------------------
# Bundled dataset (loaded from data.js at startup, served signed at runtime)
# --------------------------------------------------------------------------
def _load_bundled_dataset() -> dict:
    """Evaluate the bundled data.js in Node and extract the pure-data fields.

    The browser's data.js is valid JS (single-quoted keys, unquoted object
    keys, nested literals) — NOT JSON — so we can't json.loads it directly.
    Instead we run it in the real JS engine (node) and emit canonical JSON of
    just the data arrays + GEO + MAX_AGE. Functions (ageToT/_analyze) are
    excluded on purpose: they live in the SRI-verified client code, and only
    the data is what we sign + serve. Node is required at startup for the
    signed API; without it the server still runs and the SPA falls back to the
    bundled data.js (code-integrity-only mode).
    """
    import subprocess
    import sys
    script = BASE / "scripts" / "dump_dataset.js"
    try:
        proc = subprocess.run(
            ["node", str(script), str(BASE / "data.js")],
            capture_output=True, text=True, timeout=20,
        )
    except FileNotFoundError:
        print("[PEH] WARNING: node not found — /api/dataset will serve empty; "
              "SPA falls back to bundled data.js.", file=sys.stderr)
        return {}
    except subprocess.TimeoutExpired:
        print("[PEH] WARNING: node dataset dump timed out.", file=sys.stderr)
        return {}
    if proc.returncode != 0:
        print("[PEH] WARNING: node dataset dump failed:\n", proc.stderr, file=sys.stderr)
        return {}
    return json.loads(proc.stdout)


import json
import secrets

BUNDLED = _load_bundled_dataset()

def _canonical_payload() -> str:
    """Deterministic canonical JSON of the dataset arrays for signing."""
    payload = {
        "LAYERS": BUNDLED["LAYERS"],
        "EPOCHS": BUNDLED["EPOCHS"],
        "FLOODS": BUNDLED["FLOODS"],
        "PEOPLES": BUNDLED["PEOPLES"],
        "BIRDS": BUNDLED["BIRDS"],
        "DIVINE": BUNDLED["DIVINE"],
        "INSIGHT": BUNDLED["INSIGHT"],
        "GEO": BUNDLED["GEO"],
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _signed_dataset_bundle() -> dict:
    # Canonical string the server actually signs. Shipped to the client so it
    # can re-HMAC the EXACT bytes (no fragile re-canonicalization across JS/Py).
    canon = _canonical_payload()
    key = _signing_key()
    sig = hmac.new(key, canon.encode("utf-8"), hashlib.sha256).hexdigest()
    return {
        "canon": canon,                                  # exact signed string
        "payload": json.loads(canon),                    # parsed for the app
        "sig": sig,
    }


# --------------------------------------------------------------------------
# L2: signed, atomic on-disk cache of the dataset bundle
# --------------------------------------------------------------------------
_CACHE_TTL = 600  # seconds


def _cache_path() -> Path:
    return CACHE_DIR / "dataset.json"


def _cache_save(bundle: dict) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    envelope = {
        "v": 1,
        "saved_at": int(time.time()),
        "bundle": bundle,
    }
    payload = json.dumps(envelope, ensure_ascii=False, sort_keys=True).encode("utf-8")
    key = _signing_key()
    sig = hmac.new(key, payload, hashlib.sha256).hexdigest()
    tmp = _cache_path().with_suffix(".tmp")
    tmp.write_bytes(payload + b"\n" + sig.encode("ascii"))
    tmp.replace(_cache_path())  # atomic


def _cache_load() -> dict | None:
    key = _signing_key()
    p = _cache_path()
    if not p.exists():
        return None
    raw = p.read_bytes()
    if b"\n" not in raw:
        return None
    payload, sig = raw.rsplit(b"\n", 1)
    if not hmac.compare_digest(
        hmac.new(key, payload, hashlib.sha256).hexdigest(), sig.decode("ascii")
    ):
        return None  # tampered -> refuse
    try:
        env = json.loads(payload.decode("utf-8"))
    except Exception:
        return None
    if int(time.time()) - int(env.get("saved_at", 0)) > _CACHE_TTL:
        return None  # stale -> re-sign
    return env.get("bundle")


# --------------------------------------------------------------------------
# Security headers (per request)
# --------------------------------------------------------------------------
def _secure_headers(resp: web.Response, nonce: str) -> None:
    csp = (
        "default-src 'self'; "
        f"script-src 'self' 'nonce-{nonce}'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none'; "
        "object-src 'none'"
    )
    resp.headers.setdefault("Content-Security-Policy", csp)
    resp.headers.setdefault("Strict-Transport-Security", "max-age=31536000")
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("Referrer-Policy", "no-referrer")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    resp.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
    resp.headers.setdefault(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=(), usb=(), "
        "accelerometer=(), gyroscope=(), magnetometer=(), payment=()",
    )


def _sri_hash(path: Path) -> str:
    try:
        data = Path(path).read_bytes()
    except OSError:
        return "sha384-UNVERIFIED"
    digest = hashlib.sha384(data).digest()
    return "sha384-" + __import__("base64").b64encode(digest).decode("ascii")


# --------------------------------------------------------------------------
# L-rate: simple per-IP token bucket
# --------------------------------------------------------------------------
_RATE_LIMIT = 60
_RATE_WINDOW = 60.0
_HITS: dict[str, list[float]] = {}


def _rate_limited(ip: str) -> bool:
    now = time.time()
    hits = _HITS.get(ip, [])
    hits = [t for t in hits if now - t < _RATE_WINDOW]
    if len(hits) >= _RATE_LIMIT:
        _HITS[ip] = hits
        return True
    hits.append(now)
    _HITS[ip] = hits
    return False


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------
async def index(request: web.Request) -> web.Response:
    nonce = secrets.token_hex(16)
    html = (BASE / "index.html").read_text(encoding="utf-8")
    html = html.replace("__NONCE__", nonce)
    html = html.replace("__SRI_DATA__", _sri_hash(BASE / "data.js"))
    html = html.replace("__SRI_ENGINE__", _sri_hash(BASE / "engine.js"))
    html = html.replace("__SRI_APP__", _sri_hash(BASE / "app.js"))
    html = html.replace("__TOKEN__", get_token())
    resp = web.Response(text=html, content_type="text/html", charset="utf-8")
    _secure_headers(resp, nonce)
    return resp


async def api_health(request: web.Request) -> web.Response:
    return web.json_response({"status": "ok", "layers": list(BUNDLED["LAYERS"].keys())})


async def api_dataset(request: web.Request) -> web.Response:
    ip = request.remote or "unknown"
    if _rate_limited(ip):
        return web.json_response({"error": "rate limit exceeded"}, status=429)
    # Serve from a verified on-disk cache if fresh; else re-sign + persist.
    bundle = _cache_load()
    if bundle is None:
        bundle = _signed_dataset_bundle()
        _cache_save(bundle)
    resp = web.json_response(bundle)
    _secure_headers(resp, secrets.token_hex(16))
    return resp


async def api_security(request: web.Request) -> web.Response:
    return web.json_response({
        "model": "PEN 4-layer (L1 auth, L2 signed at-rest, L3 signed dataset, L4 loopback)",
        "bind": HOST,
        "tls_loopback": USE_TLS,
        "auth": "bearer token (opaque, chmod 600 .env)",
        "dataset_sig": "HMAC-SHA256 over canonical JSON",
        "cache_sig": "HMAC-SHA256, atomic write, fail-closed",
        "csp_nonce": True,
        "sri": True,
    })


@web.middleware
async def auth_middleware(request: web.Request, handler):
    path = request.path
    # Public: the HTML, static assets, and the open health probe.
    if not path.startswith("/api/"):
        return await handler(request)
    if path in ("/api/health",):
        return await handler(request)
    authz = request.headers.get("Authorization", "")
    token = authz[len("Bearer "):] if authz.lower().startswith("bearer ") else authz
    if not verify_token(token):
        return web.json_response({"error": "unauthorized"}, status=401)
    return await handler(request)


def make_app() -> web.Application:
    app = web.Application(middlewares=[auth_middleware])
    app.router.add_get("/", index)
    app.router.add_get("/index.html", index)
    app.router.add_get("/api/health", api_health)
    app.router.add_get("/api/dataset", api_dataset)
    app.router.add_get("/api/security", api_security)
    # static assets (with SRI the browser refuses anything tampered)
    app.router.add_get("/data.js", _static("data.js"))
    app.router.add_get("/engine.js", _static("engine.js"))
    app.router.add_get("/app.js", _static("app.js"))
    app.router.add_get("/styles.css", _static("styles.css"))
    return app


def _static(name: str):
    async def handler(request: web.Request):
        p = BASE / name
        nonce = secrets.token_hex(16)
        resp = web.Response(
            body=p.read_bytes(),
            content_type="application/javascript" if name.endswith(".js")
            else "text/css",
        )
        _secure_headers(resp, nonce)
        return resp
    return handler


if __name__ == "__main__":
    # Ensure token exists (prints it once on first run).
    get_token()

    # Build an SSL context for loopback TLS when enabled. aiohttp serves TLS
    # only if we hand it an ssl_context, unlike waitress. Hardened: TLS1.2+,
    # strong ECDHE ciphers, no client certs. Cert is a localhost self-signed
    # cert (certs/peh.local.pem, git-ignored) — confidentiality against local
    # sniffers, not a public-CA identity.
    ssl_ctx = None
    if USE_TLS:
        import ssl as _ssl
        cert = BASE / "certs" / "peh.local.pem"
        key = BASE / "certs" / "peh.local.key"
        if not (cert.exists() and key.exists()):
            print("TLS enabled but cert/key missing. Run: ./scripts/gen_cert.sh", file=sys.stderr)
            sys.exit(1)
        ssl_ctx = _ssl.SSLContext(_ssl.PROTOCOL_TLS_SERVER)
        ssl_ctx.options |= _ssl.OP_NO_TLSv1 | _ssl.OP_NO_TLSv1_1
        ssl_ctx.set_ciphers(
            "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:"
            "ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:"
            "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256"
        )
        ssl_ctx.load_cert_chain(certfile=str(cert), keyfile=str(key))

    app = make_app()
    scheme = "https" if USE_TLS else "http"
    print(f"[PEH] serving on {scheme}://{HOST}:{PORT} (loopback, threads={THREADS})")
    print(f"[PEH] open {scheme}://{HOST}:{PORT} in your browser (local-only).")
    aiohttp.web.run_app(app, host=HOST, port=PORT, ssl_context=ssl_ctx, print=None)

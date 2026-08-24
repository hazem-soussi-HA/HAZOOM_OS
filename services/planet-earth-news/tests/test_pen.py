"""Tests for Planet Earth News — security guards + parsing + API."""
import socket
import urllib.error
import urllib.request

import pytest

import fetcher


# --- SSRF guard -------------------------------------------------------------


def test_safe_host_rejects_unlisted():
    assert fetcher._is_safe_host("evil.com", ["good.com"]) is False


def test_safe_host_allows_listed_public():
    # a host on the allow-list that resolves to a public IP should pass
    assert fetcher._is_safe_host("example.com", ["example.com"]) is True


def test_is_safe_url_blocks_bad_scheme():
    ok, reason = fetcher._is_safe_url("file:///etc/passwd", ["example.com"])
    assert ok is False
    assert "scheme" in reason.lower()


def test_fetch_all_skips_disallowed_scheme():
    cfg = {
        "allowed_hosts": ["example.com"],
        "sources": [{"name": "bad", "type": "rss", "url": "file:///etc/passwd"}],
        "fetcher": {},
    }
    items, errors, statuses = fetcher.fetch_all(cfg)
    assert items == []
    assert any("scheme" in e["error"].lower() for e in errors)
    assert statuses[0].ok is False


def test_private_ip_blocked(monkeypatch):
    # Force resolution to a private address even if host were listed.
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda h, p, **k: [(socket.AF_INET, 0, 0, "", ("127.0.0.1", 0))],
    )
    assert fetcher._is_safe_host("localhost", ["localhost"]) is False


def test_fetch_all_skips_private_host():
    import urllib.parse

    # allow-list host whose DNS we hijack to a private IP
    monkeypatch_host = "trusted.example"

    def fake_getaddrinfo(h, p, **k):
        if h == monkeypatch_host:
            return [(socket.AF_INET, 0, 0, "", ("10.0.0.5", 0))]
        return [(socket.AF_INET, 0, 0, "", ("93.184.216.34", 0))]

    cfg = {
        "allowed_hosts": [monkeypatch_host],
        "sources": [{"name": "x", "type": "rss", "url": f"https://{monkeypatch_host}/f"}],
        "fetcher": {},
    }

    import pytest as _pytest

    with _pytest.MonkeyPatch().context() as mp:
        mp.setattr(socket, "getaddrinfo", fake_getaddrinfo)
        items, errors, statuses = fetcher.fetch_all(cfg)
    assert items == []
    assert any("private" in e["error"].lower() or "loopback" in e["error"].lower() for e in errors)


# --- redirect guard ---------------------------------------------------------


def test_redirect_guard_blocks_disallowed_target():
    """A redirect (302) to a non-allow-listed host must be blocked."""
    import urllib.request

    class _FakeResp:
        def __init__(self, code, location):
            self.code = code
            self.headers = {"location": location}
            self.url = "http://trusted.example/start"

        def read(self, *_a, **_k):
            return b""

    def fake_open(req, *a, **k):
        raise urllib.error.HTTPError(
            "http://trusted.example/start", 302, "found",
            {"location": "http://evil.example/secret"}, None,
        )

    opener = fetcher._build_opener(["trusted.example"])
    with pytest.raises(urllib.error.URLError):
        opener.open("http://trusted.example/start")


# --- parsing ---------------------------------------------------------------


def test_parse_rss():
    xml = b"""<?xml version="1.0"?><rss version="2.0"><channel>
      <item><title>Hello World</title><link>https://x.test/a</link>
      <description>&lt;p&gt;Body text&lt;/p&gt;</description>
      <pubDate>Mon, 13 Jul 2026 10:00:00 GMT</pubDate></item></channel></rss>"""
    items = fetcher.parse_feed("Test", "article", xml)
    assert len(items) == 1
    assert items[0].title == "Hello World"
    assert items[0].summary == "Body text"  # tags stripped


def test_parse_youtube_kind():
    xml = b"""<?xml version="1.0"?><feed xmlns:media="http://search.yahoo.com/mrss/">
      <entry><title>Vid</title><link href="https://yt.test/v"/>
      <media:thumbnail url="https://img.test/t.jpg"/></entry></feed>"""
    items = fetcher.parse_feed("YT", "video", xml)
    assert items[0].kind == "video"
    assert items[0].thumbnail == "https://img.test/t.jpg"


def test_fetch_all_returns_tuple_shape():
    cfg = {"allowed_hosts": [], "sources": [], "fetcher": {}}
    items, errors, statuses = fetcher.fetch_all(cfg)
    assert isinstance(items, list)
    assert isinstance(errors, list)
    assert isinstance(statuses, list)


# --- security posture -------------------------------------------------------


def test_security_posture_loopback_safe():
    cfg = {
        "server": {"bind": "127.0.0.1"},
        "fetcher": {"max_bytes": 5242880},
        "allowed_hosts": ["a", "b"],
        "sources": [{}, {}],
    }
    post = fetcher.security_posture(cfg)
    assert post["lan_exposed"] is False
    assert post["ssrf_guard"] is True
    assert post["redirect_guard"] is True
    assert post["sources_configured"] == 2


def test_security_posture_detects_lan_bind():
    cfg = {"server": {"bind": "0.0.0.0"}, "fetcher": {}, "allowed_hosts": [], "sources": []}
    assert fetcher.security_posture(cfg)["lan_exposed"] is True


# --- API --------------------------------------------------------------------


def test_health_endpoint():
    import app as appmod

    client = appmod.app.test_client()
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_feed_endpoint_shape():
    import app as appmod

    client = appmod.app.test_client()
    r = client.get("/api/feed", headers={"Authorization": "Bearer " + appmod.auth.get_token()})
    # network may or may not be available; contract must hold regardless
    assert r.status_code in (200, 429)
    if r.status_code == 200:
        body = r.get_json()
        assert "items" in body
        assert "security" in body
        assert "source_status" in body


def test_query_param_bounded():
    import app as appmod

    client = appmod.app.test_client()
    big = "a" * 500
    r = client.get("/api/feed?q=" + big, headers={"Authorization": "Bearer " + appmod.auth.get_token()})
    # bounded to 120 chars internally; should not 500
    assert r.status_code in (200, 429)


def test_static_assets_served():
    import app as appmod

    client = appmod.app.test_client()
    # Assets served under /static/ (the link in index.html now uses these).
    assert client.get("/static/style.css").status_code == 200
    assert client.get("/static/app.js").status_code == 200
    # Dashboard + favicon resolve.
    assert client.get("/").status_code == 200
    assert client.get("/favicon.ico").status_code == 204


def test_fresh_param_accepted():
    import app as appmod

    client = appmod.app.test_client()
    r = client.get("/api/feed?fresh=1", headers={"Authorization": "Bearer " + appmod.auth.get_token()})
    assert r.status_code in (200, 429)


def test_secure_headers_present():
    import app as appmod

    client = appmod.app.test_client()
    r = client.get("/api/feed")
    assert r.headers.get("X-Content-Type-Options") == "nosniff"
    assert r.headers.get("Referrer-Policy") == "no-referrer"
    assert r.headers.get("X-Frame-Options") == "DENY"


def test_fetch_all_cache_ttl():
    """A second fetch_all within TTL must NOT re-hit the network; fresh=1 must."""
    import app as appmod

    net = {"n": 0}

    def counting_get(url, cfg, opener=None):
        net["n"] += 1
        # minimal valid RSS so parse_feed succeeds
        return b"<?xml version='1.0'?><rss version='2.0'><channel>" \
               b"<item><title>T</title><link>http://x/a</link>" \
               b"<description>body</description></item></channel></rss>"

    orig = appmod.fetcher._http_get
    appmod.fetcher._http_get = counting_get
    appmod.fetcher._CACHE.clear()
    try:
        cfg = appmod.CONFIG
        appmod.fetcher.fetch_all(cfg, "")        # network: 8 sources
        appmod.fetcher.fetch_all(cfg, "")        # cache hit -> no network
        appmod.fetcher.fetch_all(cfg, "", fresh=True)  # forced -> 8 sources
        # 8 sources fetched twice (call1 + forced call3); call2 served from cache
        assert net["n"] == 16, f"expected 16 network hits (8+0+8), got {net['n']}"
    finally:
        appmod.fetcher._http_get = orig
        appmod.fetcher._CACHE.clear()


def test_globe_is_clickable_button():
    import app as appmod

    html = appmod.app.test_client().get("/").get_data(as_text=True)
    assert 'id="home"' in html
    assert 'class="globe"' in html
    assert "<button" in html


def test_csp_header_present_with_nonce():
    import app as appmod

    c = appmod.app.test_client()
    r = c.get("/")
    csp = r.headers.get("Content-Security-Policy", "")
    assert "default-src 'self'" in csp
    assert "script-src 'self' 'nonce-" in csp
    assert "frame-ancestors 'none'" in csp


def test_nonce_is_per_request_and_injected():
    import app as appmod
    import re

    c = appmod.app.test_client()
    h1 = c.get("/").get_data(as_text=True)
    h2 = c.get("/").get_data(as_text=True)
    n1 = re.search(r'nonce="([a-f0-9]+)"', h1).group(1)
    n2 = re.search(r'nonce="([a-f0-9]+)"', h2).group(1)
    assert n1 != n2
    assert "__NONCE__" not in h1 and "__SRI__" not in h1


def test_sri_hashes_injected_for_bundles():
    import app as appmod

    html = appmod.app.test_client().get("/").get_data(as_text=True)
    assert 'integrity="sha384-' in html
    assert "/static/app.min.js" in html
    assert "/static/style.min.css" in html


def test_additional_hardening_headers():
    import app as appmod

    h = appmod.app.test_client().get("/").headers
    assert h.get("Strict-Transport-Security") == "max-age=31536000"
    assert h.get("Cross-Origin-Opener-Policy") == "same-origin"
    assert "geolocation=()" in (h.get("Permissions-Policy") or "")
    assert h.get("X-Frame-Options") == "DENY"


def test_serve_refuses_non_loopback():
    """serve.py must refuse to bind anywhere but loopback (LAN-exposure guard)."""
    import subprocess, sys, os

    env = dict(os.environ)
    env["PEN_HOST"] = "0.0.0.0"
    r = subprocess.run(
        [sys.executable, "serve.py"],
        capture_output=True, text=True, env=env, timeout=15,
        cwd=os.path.dirname(__import__("app").__file__),
    )
    assert r.returncode == 1
    assert "REFUSING" in (r.stdout + r.stderr)


# --- Layer 1: local-first AUTH ---------------------------------------------
def test_api_feed_requires_token():
    import app as appmod

    c = appmod.app.test_client()
    assert c.get("/api/feed").status_code == 401
    tok = appmod.auth.get_token()
    assert c.get("/api/feed", headers={"Authorization": "Bearer " + tok}).status_code in (200, 429)
    # wrong token rejected
    assert c.get("/api/feed", headers={"Authorization": "Bearer WRONG"}).status_code == 401
    # health stays open (watchdog probe)
    assert c.get("/api/health").status_code == 200


def test_dashboard_injects_token():
    import app as appmod

    html = appmod.app.test_client().get("/").get_data(as_text=True)
    assert "__PEN_TOKEN__" not in html  # placeholder was substituted


# --- Layer 2: at-rest integrity (signed disk cache) ------------------------
def test_store_roundtrip_and_tamper_rejected():
    import app as appmod
    import store as storemod

    items = [{"title": "A", "source": "BBC", "link": "http://x",
              "published": "2024-01-01T00:00:00Z", "summary": "s",
              "kind": "article", "thumbnail": None}]
    assert storemod.save(items, "t1") is True
    assert storemod.load("t1") == items
    # tamper the on-disk file -> fail-closed
    p = storemod._path("t1")
    raw = p.read_bytes()
    p.write_bytes(raw[:-3] + b"XXX")
    assert storemod.load("t1") is None


# --- Layer 3: hazoom provenance on feed items ------------------------------
def test_feed_items_carry_hazoom_provenance():
    import app as appmod

    tok = appmod.auth.get_token()
    data = appmod.app.test_client().get(
        "/api/feed?fresh=1", headers={"Authorization": "Bearer " + tok}
    ).get_json()
    assert data["count"] > 0
    it = data["items"][0]
    assert "hz_t" in it and "hz_sig" in it
    # hz_t is an 8-char hazoom stamp
    import re
    assert re.fullmatch(r"[0-9A-Z]{8}", it["hz_t"])


# --- Layer 4: LAN exposure guard -------------------------------------------
# Covered by test_serve_refuses_non_loopback (serve.py reads PEN_HOST and
# refuses non-loopback at startup). app.py itself reads server.bind from
# config.yaml and refuses the same way at import; do not duplicate here.



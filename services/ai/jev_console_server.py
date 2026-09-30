#!/usr/bin/env python3
"""jev_console_server.py — backend for the CLI-terminal web page.

Serves the static console folder AND a safe JSON API (no shell exec anywhere):
  GET  /                        -> terminal page (jev-terminal.html)
  GET  /api/status               -> local model info + cloud availability (never the key)
  POST /api/local/decide         -> {state, questions} via local_jev_clone (offline)
  POST /api/local/train          -> rebuild heads from labeled examples
  POST /api/local/reset          -> back to demo weights
  POST /api/cloud/decide         -> proxy to TypeSafe Jev (key stays server-side)

Key loading: $TYPESAFE_API_KEY, else /root/.env (KEY=VALUE lines).
Run:  python3 jev_console_server.py   (serves :8323, folder = this file's dir)
"""
import json
import os
import re
import time
import html as htmlmod
import urllib.request
import urllib.error

try:
    from fastapi import FastAPI, Request
    from fastapi.responses import FileResponse, JSONResponse
    from fastapi.staticfiles import StaticFiles
except ImportError:  # pragma: no cover
    raise SystemExit("need fastapi: pip install fastapi uvicorn")

HERE = os.path.dirname(os.path.abspath(__file__))
CLOUD_URL = "https://api.typesafe.ai/v1/systemone"
CLOUD_MODEL = "jev-latest"

# ---------- Sellable projects vault (sandboxed) ----------
PROJECTS_ROOT = os.path.join(HERE, "projects")
AUDIT_LOG = "/tmp/opencode/.audit-jev.log"  # outside any served tree
SITE_TYPES = ("saas", "restaurant", "portfolio", "agency", "blog", "shop")
THEMES = ("midnight", "sunset", "forest", "mono")
os.makedirs(PROJECTS_ROOT, exist_ok=True)


def audit(action, name, extra=""):
    try:
        with open(AUDIT_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps({"t": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                                "action": action, "project": name,
                                "extra": str(extra)[:200]}) + "\n")
    except OSError:
        pass


def safe_slug(raw):
    """Folder-safe slug; raises ValueError on anything suspicious."""
    s = str(raw or "").strip().lower().replace(" ", "-")
    s = re.sub(r"[^a-z0-9-]", "", s).strip("-")[:40]
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,39}", s):
        raise ValueError("bad project name (use letters, numbers, dashes)")
    return s


def project_dir(slug):
    """Resolve strictly inside the vault (kills .., absolute paths, symlink escapes)."""
    p = os.path.realpath(os.path.join(PROJECTS_ROOT, slug))
    root = os.path.realpath(PROJECTS_ROOT)
    if p != root and not p.startswith(root + os.sep):
        raise ValueError("path escape blocked")
    if os.path.basename(p) != slug:
        raise ValueError("path escape blocked")
    return p


SITE_CONTENT = {
    "saas": ("Ship faster", [
        ("Launch in minutes", "Templates, hosting and analytics in one click."),
        ("Scales with you", "From side project to IPO without replatforming."),
        ("Secure by default", "SSO, audit logs and encrypted everything."),
        ("Loved by teams", "4.9/5 from 12,000 reviews.")],
        "Pricing", [("Starter", "Free", "1 project"), ("Pro", "$19/mo", "Unlimited projects"),
                    ("Scale", "Custom", "SSO, SLA")]),
    "restaurant": ("Dinner worth leaving home for", [
        ("Farm to table", "Menu rewritten every morning around the market."),
        ("Wood-fired everything", "Oak oven, open kitchen, zero shortcuts."),
        ("Natural wines", "120 low-intervention bottles, poured by the glass."),
        ("Private room", "Fourteen seats, one long table, no phones.")],
        "Tonight’s menu", [("Charred leeks", "hazelnut, brown butter", "$14"),
                            ("Wood-fired flatbread", "stracciatella, honey", "$16"),
                            ("Dry-aged ribeye", "45 days, bone marrow", "$58"),
                            ("Olive oil cake", "citrus, mascarpone", "$12")]),
    "portfolio": ("Selected work", [
        ("Brand systems", "Identities that survive contact with reality."),
        ("Web experiences", "Sites people remember and clients can edit."),
        ("Motion", "Interfaces with a pulse, never decoration."),
        ("Art direction", "Shoots, sets and stories, end to end.")],
        "Selected work", [("Project 01", "Brand + web", "2026"), ("Project 02", "Campaign", "2026"),
                          ("Project 03", "Identity", "2025")]),
    "agency": ("We build what matters", [
        ("Strategy", "Positioning before pixels, always."),
        ("Design", "Interfaces your customers already understand."),
        ("Engineering", "Boring tech, exciting uptime."),
        ("Growth", "Experiments with a memory.")],
        "Results", [("+212%", "activation", ""), ("4.9 rating", "client score", ""),
                    ("38", "launches / yr", "")]),
    "blog": ("Ideas, weekly", [
        ("Deep dives", "One idea per week, fully unpacked."),
        ("No hot takes", "Slow thinking in a fast medium."),
        ("Interviews", "Builders on how the work really gets done."),
        ("Field notes", "Dispatches from studios and workshops.")],
        "Latest", [("The shape of good tools", "8 min read", ""),
                   ("Notes on taste", "5 min read", ""),
                   ("What clients actually buy", "11 min read", "")]),
    "shop": ("Goods worth keeping", [
        ("Small batches", "Made in runs of 200, numbered by hand."),
        ("Free returns", "60 days, no questions, prepaid label."),
        ("Repairs for life", "Send it back, we fix it, forever."),
        ("Carbon neutral", "Every order offset twice over.")],
        "Best sellers", [("Canvas Tote", "No. 01", "$48"), ("Field Jacket", "No. 02", "$220"),
                         ("Everyday Cap", "No. 03", "$36")]),
}


def build_site_html(display, stype, theme):
    tag, feats, xtitle, xitems = SITE_CONTENT[stype]
    e = htmlmod.escape
    css = ("body{font-family:system-ui,sans-serif;margin:0;background:#0b0e14;color:#f2f5fa}"
           ".w{max-width:960px;margin:0 auto;padding:0 20px}nav{display:flex;justify-content:space-between;padding:20px 0}"
           ".hero{padding:70px 0}.hero h1{font-size:44px;margin:0}.btn{display:inline-block;background:#7aa2ff;color:#06101f;"
           "padding:12px 26px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:18px}"
           ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;padding:20px 0}"
           ".card{background:#141b29;border:1px solid #263049;border-radius:12px;padding:16px}footer{color:#8b96ab;padding:30px 0}")
    feats_h = "".join(f'<div class="card"><h3>{e(a)}</h3><p>{e(b)}</p></div>' for a, b in feats)
    items_h = "".join(
        f'<div class="card"><h3>{e(a)}</h3><p>{e(b)}{" · " + e(c) if c else ""}</p></div>'
        for a, b, c in xitems)
    cta = {"restaurant": "Book a table", "shop": "Shop now"}.get(stype, "Get started")
    return ("<!doctype html><html lang=en><head><meta charset=utf-8>"
            '<meta name=viewport content="width=device-width,initial-scale=1">'
            f"<title>{e(display)}</title><style>{css}</style></head><body><div class=w>"
            f"<nav><strong>{e(display)}</strong><span>{e(stype)}</span></nav>"
            f'<div class=hero><h1>{e(display)} — {e(tag)}</h1>'
            f'<a class=btn href=#>{e(cta)}</a></div><h2>Why {e(display)}</h2>'
            f'<div class=grid>{feats_h}</div><h2>{e(xtitle)}</h2><div class=grid>{items_h}</div>'
            f"<footer>Forged by the Jev agent · {e(theme)} theme</footer></div></body></html>")


def read_manifest(slug):
    with open(os.path.join(project_dir(slug), "manifest.json"), encoding="utf-8") as f:
        return json.load(f)


def write_manifest(slug, data):
    with open(os.path.join(project_dir(slug), "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

from local_jev_clone import LocalJev, build_demo  # noqa: E402


def load_key():
    key = os.environ.get("TYPESAFE_API_KEY", "").strip()
    if key:
        return key, "env"
    for path in ("/root/.env", os.path.expanduser("~/.env")):
        try:
            with open(path, encoding="utf-8") as f:
                for line in f:
                    m = re.match(r"\s*(?:export\s+)?TYPESAFE_API_KEY\s*=\s*(.+?)\s*$", line)
                    if m:
                        v = m.group(1).strip().strip('"').strip("'")
                        if v and not v.startswith("<"):
                            return v, path
        except OSError:
            continue
    return "", ""


API_KEY, KEY_SOURCE = load_key()
MODEL = build_demo()

app = FastAPI(title="Jev Local Console")


def norm_questions(q):
    """Accept Jev-cloud shape (criteria) and local shape (options); unify to options."""
    out = {}
    for name, spec in (q or {}).items():
        if not isinstance(spec, dict):
            continue
        s = dict(spec)
        if s.get("type") == "choice" and "options" not in s and "criteria" in s:
            c = s["criteria"]
            s["options"] = c if isinstance(c, dict) else {str(v): str(v) for v in c} \
                if isinstance(c, list) else {"yes": "yes", "no": "no"}
        out[name] = s
    return out


def cloud_questions(q):
    """Map local shape back to cloud shape (choice -> criteria)."""
    out = {}
    for name, spec in (q or {}).items():
        if not isinstance(spec, dict):
            continue
        s = dict(spec)
        if s.get("type") == "choice" and "criteria" not in s and "options" in s:
            s = dict(s)
            s["criteria"] = s.pop("options")
        out[name] = s
    return out


@app.get("/api/status")
def status():
    heads = {}
    for n, e in MODEL.heads.items():
        if e["kind"] == "noul":
            heads[n] = {"kind": "noul", "temp": round(e["head"].temp, 2)}
        elif e["kind"] == "choice":
            heads[n] = {"kind": "choice", "options": list(e["options"])}
        else:
            heads[n] = {"kind": "score", "levels": e["levels"]}
    return {
        "local": {"engine": "local-jev-clone", "heads": heads,
                  "vocab": len(MODEL.tfidf.idf)},
        "cloud": {"engine": CLOUD_MODEL, "configured": bool(API_KEY),
                  "key_source": ("server-side" if API_KEY else "missing")},
    }


def _gen_text(answers, state):
    """Generate contextual text responses from model output."""
    text = state.lower()
    for qid, a in answers.items():
        if a.get("type") == "noul":
            prob = a.get("noul", 0.5)
            instr = a.get("_instructions", "")
            if prob > 0.7:
                a["text"] = f"Strongly affirmative on: {instr}. Evidence supports this."
            elif prob > 0.55:
                a["text"] = f"Leaning yes on: {instr}. Data aligns with this assessment."
            elif prob > 0.45:
                a["text"] = f"Neutral on: {instr}. Mixed signals detected."
            elif prob > 0.3:
                a["text"] = f"Leaning no on: {instr}. Evidence is weak."
            else:
                a["text"] = f"Negative on: {instr}. Not supported by current data."
        elif a.get("type") == "choice":
            pick = a.get("choice", "unknown")
            a["text"] = f"Selected '{pick}' based on contextual analysis of the state."
        elif a.get("type") == "score":
            a["text"] = f"Scored '{a.get('score','?')}' for the query."
    return answers


@app.post("/api/local/decide")
async def local_decide(req: Request):
    body = await req.json()
    state = str(body.get("state", ""))[:4000]
    questions = norm_questions(body.get("questions", {}))
    if not state.strip() or not questions:
        return JSONResponse({"error": "need non-empty state + questions"}, status_code=400)
    t0 = time.time()
    try:
        answers = MODEL.decide(state, questions)
        # Inject instruction text into answers
        for qid, qspec in questions.items():
            if qid in answers:
                answers[qid]["_instructions"] = qspec.get("instructions", "")
        answers = _gen_text(answers, state)
    except (ValueError, KeyError) as e:
        return JSONResponse({"error": str(e)}, status_code=400)
    return {"engine": "local-jev-clone", "answers": answers,
            "ms": round((time.time() - t0) * 1000, 1)}


@app.post("/api/local/train")
async def local_train(req: Request):
    global MODEL
    body = await req.json()
    heads = body.get("heads", {})
    try:
        m = LocalJev()
        metrics = {}
        if "is_urgent" in heads:
            h = heads["is_urgent"]
            m.fit_noul("is_urgent", h["texts"], h["labels"], h.get("instructions", ""))
            metrics["is_urgent"] = {"n": len(h["texts"]), "temp": m.heads["is_urgent"]["head"].temp}
        if "router" in heads:
            h = heads["router"]
            m.fit_choice("router", h["texts"], h["labels"], h["options"], h.get("instructions", ""))
            metrics["router"] = {"n": len(h["texts"])}
        if "severity" in heads:
            h = heads["severity"]
            m.fit_score("severity", h["texts"], h["labels"], h["levels"], h.get("instructions", ""))
            metrics["severity"] = {"n": len(h["texts"])}
        if not metrics:
            return JSONResponse({"error": "no heads supplied"}, status_code=400)
        MODEL = m
        return {"ok": True, "metrics": metrics, "vocab": len(m.tfidf.idf)}
    except (KeyError, ValueError, TypeError) as e:
        return JSONResponse({"error": f"bad training payload: {e}"}, status_code=400)


@app.post("/api/local/reset")
def local_reset():
    global MODEL
    MODEL = build_demo()
    return {"ok": True, "vocab": len(MODEL.tfidf.idf)}


@app.post("/api/cloud/decide")
async def cloud_decide(req: Request):
    if not API_KEY:
        return JSONResponse(
            {"error": "TYPESAFE_API_KEY not configured server-side"}, status_code=503)
    body = await req.json()
    state = str(body.get("state", ""))[:4000]
    questions = cloud_questions(body.get("questions", {}))
    if not state.strip() or not questions:
        return JSONResponse({"error": "need non-empty state + questions"}, status_code=400)
    payload = json.dumps({
        "state": state,
        "model": body.get("model", CLOUD_MODEL) if isinstance(body.get("model"), str) else CLOUD_MODEL,
        "questions": questions,
    }).encode()
    t0 = time.time()
    creq = urllib.request.Request(
        CLOUD_URL, data=payload,
        headers={"Authorization": "Bearer " + API_KEY,
                 "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(creq, timeout=30) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return JSONResponse({"error": f"cloud HTTP {e.code}: {e.read().decode()[:300]}"},
                            status_code=502)
    except OSError as e:
        return JSONResponse({"error": f"cloud unreachable: {e}"}, status_code=502)
    return {"engine": data.get("model", CLOUD_MODEL), "answers": data.get("answers", {}),
            "usage": data.get("usage", {}),
            "ms": round((time.time() - t0) * 1000, 1)}


OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
OLLAMA_MODEL = "llama3.2:3b"

INTENT_Q = {
    "is_urgent": {"type": "noul",
                  "instructions": "The message is urgent or time-sensitive"},
    "intent": {"type": "choice",
               "instructions": "What the user wants from the agent",
               "options": {
                   "site": "build, create, make, generate a website, site, landing page, portfolio, shop",
                   "question": "asks a question, wants information or help with a task",
                   "chat": "greeting, smalltalk, thanks, joke, philosophy",
                   "help": "asks what the agent can do, its capabilities, how to use it"}},
    "severity": {"type": "score", "levels": ["low", "medium", "high", "critical"]},
}

SITE_KEYWORDS = [
    ("restaurant", ("restaurant", "menu", "food", "pizza", "cafe", "diner", "eatery")),
    ("saas", ("saas", "software", "startup", "app", "platform", "landing page",)),
    ("portfolio", ("portfolio", "photograph", "design work", "artwork", "gallery")),
    ("agency", ("agency", "studio", "marketing",)),
    ("blog", ("blog", "magazine", "articles", "newsletter")),
    ("shop", ("shop", "store", "sell", "buy", "boutique", "products")),
]
SITE_WORDS = ("site", "website", "web site", "webpage", "page")

INTENT_FALLBACK = [
    ("site", tuple(w for _, ws in SITE_KEYWORDS for w in ws) + SITE_WORDS),
    ("help", ("help", "what can you", "capabilit", "how do i use", "commands", "how does this work")),
    ("chat", ("hello", "hi", "hey", "thanks", "thank you", "bye", "joke",
              "who are you", "your name", "how are you", "created", "time")),
]


def route_intent(text, answers):
    """Confidence-gated routing: trust the head when sure, else keyword priors."""
    choice = answers["intent"]
    if choice["confidence"] >= 0.15:
        return choice["choice"]
    low = text.lower()
    for intent, words in INTENT_FALLBACK:
        if any(w in low for w in words):
            return intent
    return "question"

NAME_RES = [
    re.compile(r"(?:called|named)\s+([A-Za-z0-9][\w&'’.\-]*(?:\s+[A-Za-z0-9][\w&'’.\-]*){0,3})"),
    re.compile(r"(?:for|of)\s+([A-Z][\w&'’.\-]*(?:\s+[A-Z][\w&'’.\-]*){0,3})"),
    re.compile(r"[\"“]([^\"”]{1,40})[\"”]"),
]


def site_slots(text):
    low = text.lower()
    stype = None
    for key, words in SITE_KEYWORDS:
        if any(w in low for w in words):
            stype = key
            break
    if stype is None and any(w in low for w in SITE_WORDS):
        stype = "saas"
    name = None
    for rx in NAME_RES:
        m = rx.search(text)
        if m:
            name = m.group(1).strip().rstrip(".,!?")[:60]
            break
    return stype, name


def ollama_say(system, user):
    payload = json.dumps({
        "model": OLLAMA_MODEL, "stream": False,
        "options": {"num_predict": 200, "temperature": 0.7},
        "messages": [{"role": "system", "content": system},
                     {"role": "user", "content": user}],
    }).encode()
    req = urllib.request.Request(OLLAMA_URL, data=payload,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return str(json.loads(resp.read())["message"]["content"]).strip()[:1200]


def template_reply(text, answers, intent, stype, name, pending):
    urg = answers["is_urgent"]["noul"]
    sev = answers["severity"]["score"]
    if intent == "site" and stype and name:
        return (f"On it — forging your {stype} site for {name}. "
                f"(urgency {urg:.2f}, severity {sev:.2f})")
    if intent == "site":
        missing = "the business name" if stype else "what kind of site (saas, restaurant, portfolio, agency, blog, shop)"
        extra = f" — {stype} it is" if stype else ""
        return (f"Love it{extra}. Just tell me {missing} and I'll build it right here.")
    if intent == "help":
        return ("I decide and I build: ask me anything (I score urgency and route it), "
                "or say e.g. 'make a restaurant site for Casa Luna' and I'll forge the whole site.")
    if urg >= 0.7:
        return (f"Got it — this reads urgent ({urg:.2f}), I've flagged it high priority. "
                "Tell me what to do first.")
    return (f"Understood (urgency {urg:.2f}, severity {sev:.2f}). "
            "What should I do with that — answer, route, or build something?")


@app.post("/api/agent/chat")
async def agent_chat(req: Request):
    body = await req.json()
    text = str(body.get("text", ""))[:2000]
    ctx = body.get("context", {}) if isinstance(body.get("context"), dict) else {}
    if not text.strip():
        return JSONResponse({"error": "empty text"}, status_code=400)
    t0 = time.time()
    answers = MODEL.decide(text, norm_questions(INTENT_Q))
    intent = route_intent(text, answers)
    answers["intent"]["choice"] = intent  # graph shows the routed intent
    stype, name = site_slots(text)
    pending = ctx.get("pendingSiteType")
    if pending and not stype and len(text) < 60 and intent in ("question", "chat"):
        # user likely just answered "what's the business called?" with a bare name
        if re.fullmatch(r"[A-Za-z0-9][\w&'’.\-]*(?:\s+[A-Za-z0-9][\w&'’.\-]*){0,3}", text.strip()):
            stype, name = pending, text.strip()
            intent = "site"
    action = {"type": "none"}
    new_pending = None
    if intent == "site":
        if stype and name:
            action = {"type": "forge_site", "siteType": stype, "name": name}
        else:
            new_pending = stype  # remember type while we ask for the name
    now = time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime())
    system = ("You are the voice of the Jev agent terminal. Reply in 1-2 short sentences, "
              "warm and direct. Never mention temperatures, logits, or internal field names. "
              "Never write out a website design in text — the forge panel renders it. "
              "Decisions: " + json.dumps(answers) + ". Server time: " + now + ". " +
              ("Site type known: " + stype + ". " if stype else "") +
              ("Business name known: " + name + ". " if name else "") +
              ("Still missing: " + ("business name" if stype and not name else
                                    "site kind (saas/restaurant/portfolio/agency/blog/shop)" if not stype else "nothing") + ". "
               if intent == "site" and not (stype and name) else "") +
              ("If a site will be forged, confirm it briefly." if action["type"] == "forge_site" else
               "If info is missing for the site, ask exactly one short question for it."))
    try:
        reply = ollama_say(system, text)
        voice = OLLAMA_MODEL
    except OSError:
        reply = template_reply(text, answers, intent, stype, name, pending)
        voice = "template-fallback"
    return {"reply": reply, "voice": voice, "intent": intent,
            "decisions": answers, "action": action,
            "context": {"pendingSiteType": new_pending},
            "ms": round((time.time() - t0) * 1000, 1)}


def parse_price(raw):
    m = re.match(r"\s*\$?\s*([0-9]+(?:\.[0-9]{1,2})?)\s*([A-Za-z]{0,4})\s*$", str(raw or ""))
    if not m:
        raise ValueError("price like 500 or $500 [USD]")
    return float(m.group(1)), (m.group(2) or "USD").upper()


@app.post("/api/projects/save")
async def projects_save(req: Request):
    body = await req.json()
    try:
        stype = str(body.get("type", "")).lower()
        theme = str(body.get("theme", "midnight")).lower()
        display = str(body.get("name", ""))[:60].strip()
        if stype not in SITE_TYPES:
            raise ValueError("type must be one of: " + ", ".join(SITE_TYPES))
        if theme not in THEMES:
            theme = "midnight"
        if not display:
            raise ValueError("name required")
        slug = safe_slug(body.get("slug") or display)
        d = project_dir(slug)
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
            f.write(build_site_html(display, stype, theme))
        manifest = {"name": display, "slug": slug, "type": stype, "theme": theme,
                    "status": "draft", "price": None, "currency": "USD",
                    "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "url": f"/projects/{slug}/", "files": ["index.html", "manifest.json"]}
        write_manifest(slug, manifest)
        audit("save", slug, f"{stype}/{theme}")
        return {"ok": True, "project": manifest}
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=400)


@app.get("/api/projects")
def projects_list():
    out = []
    try:
        slugs = sorted(os.listdir(PROJECTS_ROOT))
    except OSError:
        slugs = []
    for slug in slugs:
        try:
            safe_slug(slug)
            out.append(read_manifest(slug))
        except (ValueError, OSError, json.JSONDecodeError):
            continue
    return {"projects": out}


@app.post("/api/projects/sell")
async def projects_sell(req: Request):
    body = await req.json()
    try:
        slug = safe_slug(body.get("name", ""))
        amount, currency = parse_price(body.get("price", ""))
        m = read_manifest(slug)
        m["status"] = "for-sale"
        m["price"] = amount
        m["currency"] = currency
        write_manifest(slug, m)
        audit("for-sale", slug, f"{amount} {currency}")
        return {"ok": True, "project": m}
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=400)
    except OSError:
        return JSONResponse({"error": "unknown project"}, status_code=404)


@app.post("/api/projects/sold")
async def projects_sold(req: Request):
    body = await req.json()
    try:
        slug = safe_slug(body.get("name", ""))
        m = read_manifest(slug)
        m["status"] = "sold"
        write_manifest(slug, m)
        audit("sold", slug, "")
        return {"ok": True, "project": m}
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=400)
    except OSError:
        return JSONResponse({"error": "unknown project"}, status_code=404)


@app.get("/", include_in_schema=False)
def root():
    return FileResponse(os.path.join(HERE, "jev-terminal.html"))


app.mount("/static", StaticFiles(directory=HERE), name="static")
app.mount("/projects", StaticFiles(directory=PROJECTS_ROOT, html=True), name="projects")
# Serve sibling pages (index.html, local-build.html, ...) + terminal by filename.
app.mount("/", StaticFiles(directory=HERE, html=False), name="root")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8323, log_level="info")

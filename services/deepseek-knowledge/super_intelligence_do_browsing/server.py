from __future__ import annotations

import asyncio
import logging
from aiohttp import web

from mimo_browser.config import BrowserConfig, BrowserMode
from mimo_browser.browser_engine import BrowserEngine
from mimo_browser.intelligence import IntelligenceEngine, URLResolver
from mimo_browser.memory import MemoryStore

logger = logging.getLogger("mimo.server")

DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MiMo Browser v2.5</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',system-ui,sans-serif; background:#0a0a0a; color:#e0e0e0; }
  .header { background:linear-gradient(135deg,#1a1a2e,#16213e); padding:20px 30px; border-bottom:2px solid #0f3460; display:flex; justify-content:space-between; align-items:center; }
  .header h1 { color:#00d4ff; font-size:24px; }
  .header span { color:#666; font-size:13px; }
  .container { display:grid; grid-template-columns:320px 1fr; height:calc(100vh - 80px); }
  .sidebar { background:#111; border-right:1px solid #222; padding:15px; overflow-y:auto; }
  .main { padding:15px; overflow-y:auto; }
  .card { background:#1a1a1a; border:1px solid #333; border-radius:8px; padding:12px; margin-bottom:12px; }
  .card h3 { color:#00d4ff; margin-bottom:8px; font-size:13px; text-transform:uppercase; letter-spacing:1px; }
  label { display:block; color:#888; font-size:11px; margin-bottom:3px; }
  input, select, textarea { width:100%; padding:7px 9px; background:#0d0d0d; border:1px solid #333; color:#fff; border-radius:4px; font-size:12px; }
  textarea { min-height:60px; resize:vertical; font-family:monospace; }
  button { padding:8px 16px; border:none; border-radius:4px; cursor:pointer; font-size:12px; font-weight:600; }
  .btn-primary { background:#0f3460; color:#00d4ff; }
  .btn-primary:hover { background:#1a4a7a; }
  .btn-danger { background:#5c1a1a; color:#ff4444; }
  .btn-stop { background:#3a1a1a; color:#ff4444; border:1px solid #ff444444; }
  .result { background:#0d0d0d; border:1px solid #222; border-radius:4px; padding:10px; margin-top:8px; font-family:'Cascadia Code','Fira Code',monospace; font-size:11px; white-space:pre-wrap; max-height:500px; overflow-y:auto; color:#aaa; line-height:1.5; }
  .status { display:inline-block; padding:3px 8px; border-radius:3px; font-size:11px; font-weight:600; }
  .status-ok { background:#1a3a1a; color:#44ff88; }
  .status-err { background:#3a1a1a; color:#ff4444; }
  .status-idle { background:#2a2a1a; color:#ffaa44; }
  .status-run { background:#1a1a3a; color:#4488ff; }
  .stat-val { font-size:26px; font-weight:700; color:#00d4ff; }
  .stat-label { font-size:10px; color:#666; text-transform:uppercase; }
  .log-entry { padding:3px 0; border-bottom:1px solid #1a1a1a; font-size:11px; font-family:monospace; }
  .log-time { color:#555; }
  .log-ok { color:#44ff88; }
  .log-err { color:#ff4444; }
  .quick-btn { padding:7px; background:#16213e; border:1px solid #0f3460; color:#00d4ff; border-radius:4px; cursor:pointer; font-size:11px; text-align:center; }
  .quick-btn:hover { background:#1a4a7a; }
  .url-bar { display:flex; gap:6px; margin-bottom:12px; }
  .url-bar input { flex:1; font-size:13px; padding:10px; }
  .url-bar button { padding:10px 20px; }
  .grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:12px; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>MiMo Browser v2.5 <span id="status" class="status status-idle">IDLE</span></h1>
    <span>Intelligent Browser Engine</span>
  </div>
  <div style="text-align:right">
    <span id="clock" style="font-size:20px;color:#00d4ff;font-family:monospace;"></span><br>
    <span id="current-url" style="color:#666;font-size:11px;">No URL</span>
  </div>
</div>
<div class="container">
  <div class="sidebar">
    <div class="card">
      <h3>URL Bar</h3>
      <div class="url-bar">
        <input id="nav-url" type="text" placeholder="Enter URL or search term..." value="">
        <button class="btn-primary" onclick="doNavigate()">GO</button>
      </div>
    </div>

    <div class="card">
      <h3>Search Engine</h3>
      <div class="grid-2">
        <div>
          <label>Query</label>
          <input id="search-query" type="text" placeholder="search...">
        </div>
        <div>
          <label>Engine</label>
          <select id="search-engine">
            <option value="google">Google</option>
            <option value="bing">Bing</option>
            <option value="duckduckgo">DuckDuckGo</option>
          </select>
        </div>
      </div>
      <br>
      <button class="btn-primary" onclick="doSearch()" style="width:100%">Search</button>
    </div>

    <div class="card">
      <h3>Extract Data</h3>
      <label>CSS Selector (leave empty for full page)</label>
      <input id="extract-selector" type="text" placeholder="body, table, .class, #id">
      <br><br>
      <div class="grid-2">
        <button class="btn-primary" onclick="doExtract()">Extract</button>
        <button class="btn-primary" onclick="quickAction('screenshot')">Screenshot</button>
      </div>
    </div>

    <div class="card">
      <h3>Custom Task</h3>
      <label>Goal</label>
      <textarea id="task-goal" placeholder="describe what to do..."></textarea>
      <label style="margin-top:6px">Mode</label>
      <select id="task-mode">
        <option value="explore">Explore</option>
        <option value="search">Search</option>
        <option value="extract">Extract</option>
        <option value="interact">Interact</option>
      </select>
      <br><br>
      <button class="btn-primary" onclick="doTask()" style="width:100%">Execute Task</button>
    </div>

    <div class="card">
      <h3>Quick Actions</h3>
      <div class="grid-2">
        <div class="quick-btn" onclick="quickAction('back')">Back</div>
        <div class="quick-btn" onclick="quickAction('forward')">Forward</div>
        <div class="quick-btn" onclick="quickAction('refresh')">Refresh</div>
        <div class="quick-btn" onclick="quickAction('scroll_down')">Scroll Down</div>
        <div class="quick-btn" onclick="quickAction('scroll_up')">Scroll Up</div>
        <div class="quick-btn" onclick="quickAction('screenshot')">Screenshot</div>
      </div>
    </div>
  </div>

  <div class="main">
    <div class="grid-4">
      <div class="card" style="text-align:center">
        <div class="stat-val" id="stat-tasks">0</div>
        <div class="stat-label">Tasks</div>
      </div>
      <div class="card" style="text-align:center">
        <div class="stat-val" id="stat-success" style="color:#44ff88">0</div>
        <div class="stat-label">Success</div>
      </div>
      <div class="card" style="text-align:center">
        <div class="stat-val" id="stat-failed" style="color:#ff4444">0</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="card" style="text-align:center">
        <div class="stat-val" id="stat-memories" style="color:#ffaa44">0</div>
        <div class="stat-label">Memories</div>
      </div>
    </div>

    <div class="card">
      <h3>Page Content</h3>
      <div id="page-content" class="result">Ready. Enter a URL or use the controls to start browsing.</div>
    </div>

    <div class="card">
      <h3>Execution Log</h3>
      <div id="log-output" style="max-height:200px;overflow-y:auto;"></div>
    </div>
  </div>
</div>

<script>
let stats = {tasks:0, success:0, failed:0, memories:0};

function setStatus(s, cls) {
  document.getElementById('status').textContent = s;
  document.getElementById('status').className = 'status ' + cls;
}

function addLog(msg, ok) {
  const el = document.getElementById('log-output');
  const t = new Date().toLocaleTimeString();
  const cls = ok === true ? 'log-ok' : ok === false ? 'log-err' : '';
  el.innerHTML = '<div class="log-entry ' + cls + '"><span class="log-time">[' + t + ']</span> ' + msg + '</div>' + el.innerHTML;
}

async function apiCall(endpoint, body) {
  setStatus('RUNNING', 'status-run');
  addLog('-> ' + endpoint, null);
  try {
    const resp = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const data = await resp.json();
    if (data.success) { setStatus('OK', 'status-ok'); addLog('<- SUCCESS', true); }
    else { setStatus('FAILED', 'status-err'); addLog('<- FAILED: '+(data.error||'unknown'), false); }
    return data;
  } catch(e) {
    setStatus('ERROR', 'status-err');
    addLog('<- ERROR: '+e.message, false);
    return {success:false, error:e.message};
  }
}

function updateStats() {
  document.getElementById('stat-tasks').textContent = stats.tasks;
  document.getElementById('stat-success').textContent = stats.success;
  document.getElementById('stat-failed').textContent = stats.failed;
  document.getElementById('stat-memories').textContent = stats.memories;
}

function setContent(text) {
  document.getElementById('page-content').textContent = text;
}

function setUrl(url) {
  document.getElementById('current-url').textContent = url || 'No URL';
}

function formatResult(data) {
  if (!data) return 'No data';
  if (typeof data === 'string') return data;
  try {
    const out = [];
    if (data.url) out.push('URL: ' + data.url);
    if (data.page_type) out.push('Type: ' + data.page_type);
    if (data.structured && data.structured.title) out.push('Title: ' + data.structured.title);
    if (data.text) out.push('\\n--- TEXT ---\\n' + data.text.substring(0, 3000));
    if (data.top_links && data.top_links.length) {
      out.push('\\n--- LINKS (' + data.links_count + ' total) ---');
      data.top_links.slice(0, 15).forEach(l => out.push('  ' + (l.text||'').substring(0,60) + ' -> ' + l.url));
    }
    if (data.interactive_count) out.push('\\nInteractive elements: ' + data.interactive_count);
    return out.join('\\n');
  } catch(e) { return JSON.stringify(data, null, 2); }
}

async function doNavigate() {
  const url = document.getElementById('nav-url').value.trim();
  if (!url) return;
  stats.tasks++;
  updateStats();
  const data = await apiCall('/api/navigate', {url: url});
  if (data.success && data.result) {
    stats.success++;
    setUrl(url);
    const r = data.result;
    const lastStep = r.results && r.results[r.results.length - 1];
    if (lastStep && lastStep.data) setContent(lastStep.data);
    else setContent(JSON.stringify(r, null, 2));
  } else {
    stats.failed++;
    setContent('Error: ' + (data.error || JSON.stringify(data.result || data)));
  }
  updateStats();
}

async function doSearch() {
  const query = document.getElementById('search-query').value.trim();
  const engine = document.getElementById('search-engine').value;
  if (!query) return;
  stats.tasks++;
  updateStats();
  const data = await apiCall('/api/search', {query, engine});
  if (data.success && data.result) {
    stats.success++;
    const r = data.result;
    const lastStep = r.results && r.results[r.results.length - 1];
    if (lastStep && lastStep.data) setContent(lastStep.data);
    else setContent(JSON.stringify(r, null, 2));
  } else {
    stats.failed++;
    setContent('Error: ' + (data.error || 'Search failed'));
  }
  updateStats();
}

async function doExtract() {
  const selector = document.getElementById('extract-selector').value.trim() || 'body';
  stats.tasks++;
  updateStats();
  const data = await apiCall('/api/extract', {selector});
  if (data.success && data.result) {
    stats.success++;
    setContent(formatResult(data.result));
  } else {
    stats.failed++;
    setContent('Error: ' + (data.error || 'Extract failed'));
  }
  updateStats();
}

async function doTask() {
  const goal = document.getElementById('task-goal').value.trim();
  const mode = document.getElementById('task-mode').value;
  if (!goal) return;
  stats.tasks++;
  updateStats();
  const data = await apiCall('/api/task', {goal, mode});
  if (data.success && data.result) {
    stats.success++;
    setContent(JSON.stringify(data.result, null, 2));
  } else {
    stats.failed++;
    setContent('Error: ' + (data.error || 'Task failed'));
  }
  updateStats();
}

async function quickAction(action) {
  stats.tasks++;
  updateStats();
  const data = await apiCall('/api/action', {action});
  if (data.success) {
    stats.success++;
    if (data.result) setContent(formatResult(data.result));
  } else {
    stats.failed++;
  }
  updateStats();
}

async function refreshStats() {
  try {
    const resp = await fetch('/api/stats');
    const data = await resp.json();
    stats.memories = data.memories || 0;
    updateStats();
    if (data.current_url) setUrl(data.current_url);
  } catch(e) {}
}

document.getElementById('nav-url').addEventListener('keydown', e => { if (e.key === 'Enter') doNavigate(); });

setInterval(() => document.getElementById('clock').textContent = new Date().toLocaleTimeString(), 1000);
document.getElementById('clock').textContent = new Date().toLocaleTimeString();
setInterval(refreshStats, 5000);
refreshStats();
</script>
</body>
</html>"""


class MiMoServer:
    def __init__(self, host: str = "0.0.0.0", port: int = 8080) -> None:
        self.host = host
        self.port = port
        self.config = BrowserConfig(headless=True)
        self.browser = BrowserEngine(self.config)
        self.intelligence = IntelligenceEngine(self.config)
        self.memory = MemoryStore()
        self._current_url = ""
        self._task_count = 0
        self._success_count = 0

    async def start_browser(self) -> None:
        await self.browser.start()
        await self.intelligence.initialize(self.browser)
        logger.info("Browser engine initialized")

    def _json(self, data: dict, status: int = 200) -> web.Response:
        return web.json_response(data, status=status)

    async def handle_index(self, request: web.Request) -> web.Response:
        return web.Response(text=DASHBOARD_HTML, content_type="text/html")

    async def handle_navigate(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
            url = body.get("url", "")
            if not url:
                return self._json({"success": False, "error": "No URL"}, 400)

            self._current_url = url
            self._task_count += 1

            resolved = await self.intelligence.resolve_and_validate(url)
            logger.info("URL resolved: %s -> %s (valid=%s)", url, resolved.get("url"), resolved.get("valid"))

            result = await self.intelligence.execute_goal(f"Navigate to {resolved['url']}", BrowserMode.EXPLORE)
            if result.get("success"):
                self._success_count += 1
                self.memory.remember({"action": "navigate", "url": resolved["url"], "success": True})

            return self._json({"success": result.get("success", False), "result": result})
        except Exception as e:
            logger.exception("Navigate failed")
            return self._json({"success": False, "error": str(e)}, 500)

    async def handle_search(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
            query = body.get("query", "")
            engine = body.get("engine", "google")
            if not query:
                return self._json({"success": False, "error": "No query"}, 400)

            self._task_count += 1
            context = TaskContext(goal=f"Search for {query}", mode=BrowserMode.SEARCH, state={"query": query, "engine": engine})
            result = await self.intelligence.execute(context)
            if result.get("success"):
                self._success_count += 1
                self.memory.remember({"action": "search", "query": query, "engine": engine})

            return self._json({"success": result.get("success", False), "result": result})
        except Exception as e:
            return self._json({"success": False, "error": str(e)}, 500)

    async def handle_extract(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
            selector = body.get("selector", "body")
            self._task_count += 1

            from mimo_browser.intelligence import Action, Step
            result = await self.browser.execute_step(Step(action=Action.EXTRACT, selector=selector))
            if result.ok:
                self._success_count += 1
                return self._json({"success": True, "result": result.data})
            return self._json({"success": False, "error": result.error})
        except Exception as e:
            return self._json({"success": False, "error": str(e)}, 500)

    async def handle_task(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
            goal = body.get("goal", "")
            mode = body.get("mode", "explore")
            if not goal:
                return self._json({"success": False, "error": "No goal"}, 400)

            self._task_count += 1
            browser_mode = BrowserMode(mode)
            result = await self.intelligence.execute_goal(goal, browser_mode)
            if result.get("success"):
                self._success_count += 1
                self.memory.remember({"action": "task", "goal": goal, "mode": mode})

            return self._json({"success": result.get("success", False), "result": result})
        except Exception as e:
            return self._json({"success": False, "error": str(e)}, 500)

    async def handle_action(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
            action = body.get("action", "")
            self._task_count += 1

            from mimo_browser.intelligence import Action, Step
            action_map = {
                "screenshot": Step(action=Action.SCREENSHOT, target="manual"),
                "back": Step(action=Action.BACK),
                "forward": Step(action=Action.FORWARD),
                "refresh": Step(action=Action.REFRESH),
                "scroll_down": Step(action=Action.SCROLL, value="down"),
                "scroll_up": Step(action=Action.SCROLL, value="up"),
            }
            step = action_map.get(action)
            if not step:
                return self._json({"success": False, "error": f"Unknown action: {action}"}, 400)

            result = await self.browser.execute_step(step)
            if result.ok:
                self._success_count += 1
            return self._json({"success": result.ok, "result": {"data": result.data}})
        except Exception as e:
            return self._json({"success": False, "error": str(e)}, 500)

    async def handle_stats(self, request: web.Request) -> web.Response:
        mem_stats = self.memory.get_stats()
        return self._json({
            "tasks": self._task_count,
            "success": self._success_count,
            "failed": self._task_count - self._success_count,
            "memories": mem_stats.get("episodic_memories", 0),
            "current_url": self._current_url,
        })

    async def handle_stop(self, request: web.Request) -> web.Response:
        await self.browser.stop()
        return self._json({"success": True, "message": "Browser stopped"})

    def create_app(self) -> web.Application:
        app = web.Application()
        app.router.add_get("/", self.handle_index)
        app.router.add_post("/api/navigate", self.handle_navigate)
        app.router.add_post("/api/search", self.handle_search)
        app.router.add_post("/api/extract", self.handle_extract)
        app.router.add_post("/api/task", self.handle_task)
        app.router.add_post("/api/action", self.handle_action)
        app.router.add_get("/api/stats", self.handle_stats)
        app.router.add_post("/api/stop", self.handle_stop)
        return app

    async def run(self) -> None:
        await self.start_browser()
        app = self.create_app()
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, self.host, self.port)
        await site.start()
        logger.info("MiMo Server running at http://localhost:%d", self.port)
        await asyncio.Event().wait()


async def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    server = MiMoServer(host="0.0.0.0", port=8080)
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())

import json, sys
from playwright.sync_api import sync_playwright

BASE = "https://127.0.0.1:8770"

def main():
    errors, logs = [], []
    with sync_playwright() as p:
        b = p.chromium.launch(args=[
            "--ignore-certificate-errors", "--use-gl=swiftshader",
            "--enable-webgl", "--ignore-gpu-blocklist"])
        pg = b.new_page()
        pg.on("console", lambda m: logs.append(m.type + ": " + m.text))
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(BASE, wait_until="networkidle", timeout=20000)
        pg.wait_for_timeout(2500)

        signed = pg.evaluate(
            "window.PEH_APP && window.PEH_APP.data && window.PEH_APP.data.INSIGHT "
            "? window.PEH_APP.data.INSIGHT.length : -1")
        deep = pg.inner_text("#deep-body") if pg.query_selector("#deep-body") else ""
        insp_visible = pg.is_visible("#inspiration-strip")
        insp_text = pg.inner_text("#inspiration-strip") if insp_visible else ""
        layer_labels = pg.eval_on_selector_all(
            "#layer-list .layer-row", "els => els.map(e => e.innerText.replace(/\\n/g,' '))")
        has_insight_nodes = pg.evaluate(
            "window.PEH_APP.engine.nodes.filter(n=>n.d.layer==='insight').length")
        analysis = pg.evaluate(
            "window.PEH_APP.data._analyze ? window.PEH_APP.data._analyze() : null")
        # 7) click an INSIGHT node on the canvas (use engine screen coords) and
        #    confirm the detail card opens with the star/analysis badge.
        click_info = pg.evaluate("""() => {
            const e = window.PEH_APP.engine;
            const n = e.nodes.find(x => x.d.layer === 'insight' && x.d.kind === 'analysis');
            if (!n) return {ok:false};
            // dispatch a real click at the node's canvas position
            const cv = document.getElementById('map');
            const r = cv.getBoundingClientRect();
            const ev = new MouseEvent('click', {clientX:r.left+n.x, clientY:r.top+n.y, bubbles:true});
            cv.dispatchEvent(ev);
            return {ok:true, title:n.d.title};
        }""")
        pg.wait_for_timeout(400)
        detail_shown = pg.is_visible("#detail") and not pg.eval_on_selector(
            "#detail", "el => el.classList.contains('hidden')")
        detail_text = pg.inner_text("#detail-body") if detail_shown else ""
        b.close()

    print("=== BROWSER RENDER REPORT ===")
    print("page errors:", errors if errors else "NONE ✓")
    bad = [l for l in logs if l.startswith("error") or l.startswith("warning")]
    print("console warns/errors:", bad if bad else "none")
    print("INSIGHT length in live data:", signed)
    print("insight engine nodes:", has_insight_nodes)
    print("layer rows:", len(layer_labels))
    for l in layer_labels:
        print("   -", l)
    print("deep-analysis populated:", bool(deep.strip()), "| chars:", len(deep))
    print("inspiration visible:", insp_visible, "| text:", insp_text[:90].replace("\n", " "))
    print("analysis engine:", json.dumps(analysis, ensure_ascii=False)[:320] if analysis else "n/a")
    print("node-click detail shown:", detail_shown, "| title:", click_info.get("title", "")[:50])
    print("detail badge text head:", detail_text[:70].replace("\n", " "))
    ok = (not errors) and signed == 8 and has_insight_nodes == 8 \
          and len(layer_labels) == 6 and bool(deep.strip()) and detail_shown
    print("\nRESULT:", "ALL GREEN ✓" if ok else "CHECK ABOVE")

main()

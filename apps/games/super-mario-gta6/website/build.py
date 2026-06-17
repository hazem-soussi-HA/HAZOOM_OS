#!/usr/bin/env python3
"""
Mario GTA6 — Build System
Concatenates all JS modules + CSS into final index.html
Usage: python3 build.py
"""
import os, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
JS_DIR = os.path.join(ROOT, 'js')
CSS_DIR = os.path.join(ROOT, 'css')
OUT_FILE = os.path.join(ROOT, 'index.html')

# Module load order (dependencies first)
MODULES = [
    'js/engine/constants.js',
    'js/engine/core.js',
    'js/engine/input.js',
    'js/engine/audio.js',
    'js/engine/physics-wasm.js',
    'js/engine/physics.js',
    'js/engine/camera.js',
    'js/world/tiles.js',
    'js/world/background.js',
    'js/world/level.js',
    'js/entities/entity.js',
    'js/entities/player.js',
    'js/entities/enemies.js',
    'js/entities/police.js',
    'js/entities/powerups.js',
    'js/entities/items.js',
    'js/entities/vehicles.js',
    'js/render/sprites.js',
    'js/render/particles.js',
    'js/render/effects.js',
    'js/render/draw.js',
    'js/render/cinematic.js',
    'js/systems/racing-mode.js',
    'js/systems/racing-hud.js',
    'js/systems/racing-audio.js',
    'js/systems/racing-particles.js',
    'js/systems/racing-opponents.js',
    'js/world/road-generator.js',
    'js/world/car-3d.js',
    'js/ui/hud.js',
    'js/ui/menus.js',
    'js/ui/dialog.js',
    'js/ui/settings-ui.js',
    'js/systems/save.js',
    'js/systems/rewards.js',
    'js/systems/settings.js',
    'js/systems/debug.js',
    'js/main.js',
]

def load_file(path):
    if not os.path.exists(path):
        print(f"  MISSING: {path}")
        return ""
    with open(path, 'r') as f:
        return f.read()

def build():
    print("Building Mario GTA6...")

    # Load all JS modules
    js_code = ""
    loaded = 0
    for mod in MODULES:
        full_path = os.path.join(ROOT, mod)
        content = load_file(full_path)
        if content:
            js_code += f"\n// ═══ {mod.upper()} ═══\n{content}\n"
            loaded += 1

    # Load all CSS
    css_code = ""
    css_files = sorted(glob.glob(os.path.join(CSS_DIR, '*.css')))
    for css_file in css_files:
        css_code += load_file(css_file) + "\n"

    # Copy WASM physics module if it exists
    wasm_src = os.path.join(ROOT, 'js', 'vendor', 'physics', 'mario_gta6_physics_bg.wasm')
    wasm_dst = os.path.join(ROOT, 'mario_gta6_physics_bg.wasm')
    if os.path.exists(wasm_src):
        import shutil
        shutil.copy(wasm_src, wasm_dst)
        wasm_kb = os.path.getsize(wasm_dst) / 1024
        print(f"  WASM physics: {wasm_kb:.1f}KB copied to root")
    else:
        print("  WASM physics: not found (will run on JS physics fallback)")

    # Generate HTML
    html = generate_html(css_code, js_code)

    with open(OUT_FILE, 'w') as f:
        f.write(html)

    size_kb = len(html) / 1024
    print(f"✓ Built {OUT_FILE} ({size_kb:.1f}KB)")
    print(f"  JS modules: {loaded}/{len(MODULES)}")
    print(f"  CSS files: {len(css_files)}")

def generate_html(css, js):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>SUPER MARIO GTA6 — The Unified Vision</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23cc0000'/><text x='50' y='68' text-anchor='middle' font-size='55' font-weight='900' fill='white' font-family='Arial Black'>M</text></svg>">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Press+Start+2P&display=swap" rel="stylesheet">
<style>{css}</style>
</head>
<body>
<script src="js/vendor/three.min.js"></script>
<canvas id="bg-particles"></canvas>
<div id="game-container" class="game-wrapper">
    <canvas id="game-canvas"></canvas>
    <div class="game-overlay">
        <span class="controls-hint">&larr; &rarr; Move | &uarr; Space Jump | &#x21e7; Run | H Switch Hat | F Car | E/X Fire | Esc Pause</span>
        <span class="version">V1.8.0 — Rust→WASM Physics &copy; 2026 HA</span>
    </div>
</div>

<!-- ✅ V1.4 — Live Reward Widget (always visible) -->
<div id="reward-widget">
    <div class="reward-pill credits" id="rw-credits"><span class="icon">💎</span><span class="value" id="rw-credits-val">0</span><span class="label">CREDITS</span></div>
    <div class="reward-pill coins" id="rw-coins"><span class="icon">🪙</span><span class="value" id="rw-coins-val">0</span><span class="label">COINS</span></div>
    <div class="reward-pill score" id="rw-score"><span class="icon">🏆</span><span class="value" id="rw-score-val">0</span><span class="label">HIGH SCORE</span></div>
</div>

<!-- ✅ V1.4 — Reward System Section -->
<section class="reward-section" id="rewards">
    <div class="container">
        <div class="section-header reveal"><div class="section-tag">🎁 REWARDS</div><h2 class="section-title">Two Currencies.<br>One Unified Vision.</h2></div>
        <div class="reward-grid">
            <div class="reward-visual reveal">
                <div class="coin-3d coin-2">M</div>
                <div class="coin-3d">$</div>
                <div class="coin-3d coin-3">★</div>
                <div class="coin-3d diamond">💎</div>
            </div>
            <div class="reward-info reveal">
                <h3>🪙 Coins <span style="color:var(--text-dim);font-size:1rem;font-weight:500">— earned in-run</span></h3>
                <p>Pick up coins from question blocks, hidden blocks, and stomped enemies. The classic Mario currency. Use them to top up your <strong>high score</strong> and unlock bonus stages.</p>
                <h3 style="margin-top:2rem">💎 Credits <span style="color:var(--text-dim);font-size:1rem;font-weight:500">— premium &amp; persistent</span></h3>
                <p>Credits are the <strong>premium reward currency</strong> — they persist in your wallet across sessions, browser restarts, and devices. Earn them through milestones, combos, and power-up pickups.</p>
                <div class="credit-tiers">
                    <div class="credit-tier"><div class="label">🪙 100 coins collected</div><div class="reward">+1 💎</div></div>
                    <div class="credit-tier"><div class="label">🍄 Mushroom power-up</div><div class="reward">+2 💎</div></div>
                    <div class="credit-tier"><div class="label">🔥 Fire Flower power-up</div><div class="reward">+3 💎</div></div>
                    <div class="credit-tier"><div class="label">⭐ Star power</div><div class="reward">+5 💎</div></div>
                    <div class="credit-tier"><div class="label">🐢 Koopa stomp chain</div><div class="reward">+1 💎 each</div></div>
                    <div class="credit-tier"><div class="label">💥 x5 combo</div><div class="reward">+2 💎</div></div>
                    <div class="credit-tier"><div class="label">🔥 x10 combo</div><div class="reward">+5 💎</div></div>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="features" id="features">
    <div class="container">
        <div class="section-header reveal"><div class="section-tag">&#9889; FEATURES</div><h2 class="section-title">Everything You Need.<br>Nothing You Don't.</h2></div>
        <div class="features-grid">
            <div class="feature-card reveal"><div class="feature-icon">&#127812;</div><h3>Power-Ups</h3><p>Mushroom, Fire Flower, Star — hidden blocks contain secrets!</p></div>
            <div class="feature-card reveal"><div class="feature-icon">&#128034;</div><h3>Koopa Troopas</h3><p>Stomp to create a shell, kick it to defeat enemies.</p></div>
            <div class="feature-card reveal"><div class="feature-icon">&#128293;</div><h3>Fireballs</h3><p>Fire Mario shoots bouncing fireballs.</p></div>
            <div class="feature-card reveal"><div class="feature-icon">&#128165;</div><h3>Breakable Bricks</h3><p>Big Mario smashes bricks from below.</p></div>
            <div class="feature-card reveal"><div class="feature-icon">&#127925;</div><h3>Procedural BGM</h3><p>Mario-style music generated in real-time.</p></div>
            <div class="feature-card reveal"><div class="feature-icon">&#128241;</div><h3>Mobile Controls</h3><p>Touch D-pad, jump, and fire buttons.</p></div>
            <div class="feature-card reveal"><div class="feature-icon">&#127919;</div><h3>Combo System</h3><p>Chain stomps for multiplied scores.</p></div>
            <div class="feature-card reveal"><div class="feature-icon">&#128243;</div><h3>Screen Shake</h3><p>Impact feedback on every action.</p></div>
        </div>
    </div>
</section>

<footer>
    <div class="footer-bottom"><span>&copy; 2026 Hazem Soussi (HA). MIT Licensed.</span><span>Made with &#10084; and JS &mdash; unofficial fan project</span></div>
    <div class="footer-ip-notice" style="max-width:1200px;margin:1.5rem auto 0;padding:1.5rem 2rem 0;border-top:1px solid rgba(255,255,255,0.04);font-size:0.72rem;color:var(--text-muted);line-height:1.7;text-align:center">
        <strong style="color:var(--text-dim)">Unofficial fan project &mdash; not affiliated with Nintendo&reg; or Take-Two Interactive&reg; / Rockstar Games&reg;.</strong><br>
        SUPER MARIO&reg;, MARIO&reg;, KOOPA&reg;, GOOMBA&reg;, and all related character and game marks are trademarks or registered trademarks of <strong>Nintendo Co., Ltd.</strong><br>
        GRAND THEFT AUTO&reg;, GTA&reg;, and ROCKSTAR&reg; are trademarks or registered trademarks of <strong>Take-Two Interactive Software, Inc. and Rockstar Games, Inc.</strong><br>
        All original code, procedural art, and procedural audio in this project are &copy; 2026 Hazem Soussi (HA) and licensed under the <a href="../LICENSE" style="color:var(--neon-cyan)">MIT License</a>.
        See <a href="../TRADEMARKS.md" style="color:var(--neon-cyan)">TRADEMARKS.md</a> and <a href="../NOTICE_TO_IP_HOLDERS.md" style="color:var(--neon-cyan)">NOTICE_TO_IP_HOLDERS.md</a> for full attribution.
    </div>
</footer>

<script>
{js}
</script>
</body>
</html>'''

if __name__ == '__main__':
    build()

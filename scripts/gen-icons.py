#!/usr/bin/env python3
"""
HAZOOM OS — contextual application icon generator.

Renders one themed SVG per application into assets/icons/<id>.svg.

Design rules
  - One visual language: dark glass tile, per-app accent, single consistent
    stroke weight, glyph centred inside a 64x64 grid.
  - Every glyph must depict what the app DOES (its context), never an
    abbreviation. A file manager looks like folders; a terminal looks like a
    prompt; a browser looks like a globe.
  - Output is deterministic so icons can be regenerated and diffed.

Usage:  python3 scripts/gen-icons.py
"""

import os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "icons")

# id -> (accent, glyph-markup)
ICONS = {
    # ---- core workspace -------------------------------------------------
    "dashboard":        ("#00e8ff", '<rect x="14" y="16" width="15" height="13" rx="3"/><rect x="35" y="16" width="15" height="13" rx="3"/><rect x="14" y="35" width="15" height="13" rx="3"/><path d="M36 42l7-9 5 5 4-4 3 8z"/>'),
    "terminal":         ("#22c55e", '<rect x="12" y="16" width="40" height="32" rx="5"/><path d="M20 27l7 5-7 5"/><path d="M32 38h11"/>'),
    "files":            ("#f59e0b", '<path d="M14 24a4 4 0 014-4h9l4 4h15a4 4 0 014 4v16a4 4 0 01-4 4H18a4 4 0 01-4-4z"/><path d="M14 30h36"/>'),
    "browser":          ("#3b82f6", '<circle cx="32" cy="32" r="17"/><path d="M15 32h34"/><path d="M32 15c5 5 5 29 0 34-5-5-5-29 0-34z"/>'),
    "deepBrowser":      ("#6366f1", '<circle cx="29" cy="29" r="15"/><path d="M14 29h30"/><path d="M29 14c4.5 4.5 4.5 29.5 0 34"/><circle cx="44" cy="44" r="9" fill="none"/><path d="M50.5 50.5L58 58"/>'),
    "music":            ("#ec4899", '<path d="M26 44V20l18-4v24"/><circle cx="22" cy="44" r="5"/><circle cx="40" cy="40" r="5"/>'),
    "settings":         ("#94a3b8", '<circle cx="32" cy="32" r="7"/><path d="M32 14v6M32 44v6M50 32h-6M20 32h-6M44.7 19.3l-4.2 4.2M23.5 40.5l-4.2 4.2M44.7 44.7l-4.2-4.2M23.5 23.5l-4.2-4.2"/>'),
    "api-settings":     ("#0ea5e9", '<path d="M24 18l-10 14 10 14M40 18l10 14-10 14"/><path d="M35 16l-6 32"/>'),
    "navigator":        ("#f97316", '<circle cx="32" cy="32" r="17"/><path d="M41 23l-6 14-14 6 6-14z"/>'),
    "antigravity":      ("#a855f7", '<path d="M32 12v14M32 38v14M12 32h14M38 32h14"/><circle cx="32" cy="32" r="8"/><path d="M18 18l10 10M46 46L36 36M46 18L36 28M18 46l10-10"/>'),
    "user-guide":       ("#10b981", '<path d="M32 20c-5-4-12-4-17-2v28c5-2 12-2 17 2 5-4 12-4 17-2V18c-5-2-12-2-17 2z"/><path d="M32 20v28"/>'),

    # ---- cognition / ai -------------------------------------------------
    "ai":               ("#a855f7", '<circle cx="32" cy="18" r="5"/><circle cx="18" cy="42" r="5"/><circle cx="46" cy="42" r="5"/><circle cx="32" cy="32" r="5"/><path d="M32 23v4M27 35l-6 4M37 35l6 4"/>'),
    "consciousness-core": ("#c084fc", '<path d="M40 46a13 13 0 01-16-12 11 11 0 012-7 8 8 0 0115 1 9 9 0 01-1 18z"/><circle cx="27" cy="31" r="2.5"/><path d="M24 40c3 3 9 3 12 0"/>'),
    "quantum-travel":   ("#22d3ee", '<circle cx="32" cy="32" r="6"/><ellipse cx="32" cy="32" rx="20" ry="9"/><ellipse cx="32" cy="32" rx="20" ry="9" transform="rotate(60 32 32)"/><ellipse cx="32" cy="32" rx="20" ry="9" transform="rotate(-60 32 32)"/>'),
    "prompt-engineering": ("#34d399", '<rect x="13" y="17" width="38" height="26" rx="6"/><path d="M22 27l5 4-5 4"/><path d="M32 36h9"/><path d="M46 12l1.6 3.4L51 17l-3.4 1.6L46 22l-1.6-3.4L41 17l3.4-1.6z"/>'),
    "ai-deepthink":     ("#818cf8", '<path d="M40 46a13 13 0 01-16-12 11 11 0 012-7 8 8 0 0115 1 9 9 0 01-1 18z"/><circle cx="27" cy="30" r="2.5"/><path d="M24 40c3 3 9 3 12 0"/><circle cx="47" cy="17" r="6"/><path d="M47 14v3.5M47 17.5v.01"/>'),
    "ai-hazoom-intel":  ("#e879f9", '<path d="M32 14a11 11 0 00-7 20v6h14v-6a11 11 0 00-7-20z"/><path d="M26 46h12M28 51h8"/><path d="M25 27h14M25 33h14"/>'),
    "ai-general-intel": ("#d946ef", '<circle cx="32" cy="32" r="6"/><path d="M32 12v8M32 44v8M12 32h8M44 32h8M18 18l6 6M40 40l6 6M46 18l-6 6M24 40l-6 6"/><circle cx="32" cy="32" r="16" stroke-dasharray="4 5"/>'),
    "ai-serotonin":     ("#f472b6", '<path d="M32 14c9 12 14 18 14 24a14 14 0 11-28 0c0-6 5-12 14-24z"/><path d="M25 38a7 7 0 0014 0"/>'),
    "ai-mirror":        ("#60a5fa", '<rect x="18" y="13" width="28" height="38" rx="14"/><path d="M32 13v38"/><path d="M25 30a7 7 0 007 7 7 7 0 00-7-7z"/><path d="M39 30a7 7 0 01-7 7"/>'),
    "ai-quantum":       ("#2dd4bf", '<circle cx="32" cy="32" r="6"/><ellipse cx="32" cy="32" rx="20" ry="8"/><ellipse cx="32" cy="32" rx="20" ry="8" transform="rotate(60 32 32)"/><ellipse cx="32" cy="32" rx="20" ry="8" transform="rotate(-60 32 32)"/>'),
    "ai-super":         ("#fbbf24", '<path d="M32 12l5.6 14.4L52 32l-14.4 5.6L32 52l-5.6-14.4L12 32l14.4-5.6z"/>'),
    "ai-jev":           ("#4ade80", '<rect x="18" y="18" width="28" height="28" rx="5"/><path d="M26 32h6M26 26v12M38 26l-4 6 4 6"/>'),

    # ---- system / tools ------------------------------------------------
    "system-monitor":   ("#22d3ee", '<rect x="12" y="16" width="40" height="26" rx="4"/><path d="M25 50h14M32 42v8"/><path d="M18 32h6l4-7 5 12 4-8 3 5h6"/>'),
    "hazoom-net":       ("#38bdf8", '<circle cx="32" cy="20" r="6"/><circle cx="18" cy="44" r="6"/><circle cx="46" cy="44" r="6"/><path d="M29 25l-8 14M35 25l8 14M24 44h16"/>'),
    "focus-timer":      ("#f472b6", '<circle cx="32" cy="34" r="17"/><path d="M32 26v9l6 4M26 12h12M32 12v5"/>'),
    "security-center":  ("#ef4444", '<path d="M32 13l15 6v12c0 11-6 17-15 20-9-3-15-9-15-20V19z"/><path d="M26 32l5 5 8-9"/>'),
    "quantum-monitor":  ("#67e8f9", '<rect x="12" y="16" width="40" height="26" rx="4"/><path d="M25 50h14M32 42v8"/><circle cx="32" cy="29" r="7"/><path d="M32 26v6"/>'),
    "quantum-lab":      ("#a855f7", '<path d="M26 14h12M30 14v12L18 46a4 4 0 004 6h20a4 4 0 004-6L34 26V14"/><path d="M22 40h20"/><circle cx="28" cy="36" r="2"/><circle cx="36" cy="44" r="2"/>'),
    "quantum-messenger": ("#06b6d4", '<rect x="12" y="20" width="40" height="28" rx="5"/><path d="M12 24l20 14 20-14"/><circle cx="32" cy="14" r="4"/><path d="M28 14h8"/>'),
    "quantum-heat":     ("#f97316", '<path d="M30 14a4 4 0 018 0v16a10 10 0 11-8 0z"/><circle cx="34" cy="40" r="5"/><path d="M44 20v8M40 24h8"/>'),
    "quantum-portal":   ("#8b5cf6", '<ellipse cx="32" cy="32" rx="13" ry="20"/><ellipse cx="32" cy="32" rx="20" ry="13"/><circle cx="32" cy="32" r="6"/><path d="M12 14l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/>'),
    "descer":           ("#ec4899", '<circle cx="32" cy="30" r="15"/><circle cx="32" cy="30" r="5"/><path d="M32 15v-4M32 49v-4M17 30h-4M51 30h-4M21 19l-3-3M46 44l-3-3M43 19l3-3M18 44l3-3"/>'),
    "svc-descer":       ("#ec4899", '<circle cx="32" cy="30" r="15"/><circle cx="32" cy="30" r="5"/><path d="M32 15v-4M32 49v-4M17 30h-4M51 30h-4M21 19l-3-3M46 44l-3-3M43 19l3-3M18 44l3-3"/>'),
    "tool-terminal":    ("#22c55e", '<rect x="12" y="16" width="40" height="32" rx="5"/><path d="M20 27l7 5-7 5"/><path d="M32 38h11"/>'),
    "tool-files":       ("#f59e0b", '<path d="M14 24a4 4 0 014-4h9l4 4h15a4 4 0 014 4v16a4 4 0 01-4 4H18a4 4 0 01-4-4z"/><path d="M14 30h36"/>'),
    "tool-settings":    ("#94a3b8", '<circle cx="32" cy="32" r="7"/><path d="M32 14v6M32 44v6M50 32h-6M20 32h-6M44.7 19.3l-4.2 4.2M23.5 40.5l-4.2 4.2M44.7 44.7l-4.2-4.2M23.5 23.5l-4.2-4.2"/>'),
    "tool-deep-browser": ("#6366f1", '<circle cx="29" cy="29" r="15"/><path d="M14 29h30"/><circle cx="44" cy="44" r="9"/><path d="M50.5 50.5L58 58"/>'),
    "tool-github-bridge": ("#8b5cf6", '<circle cx="20" cy="16" r="5"/><circle cx="20" cy="48" r="5"/><circle cx="44" cy="32" r="5"/><path d="M20 21v22"/><path d="M25 18c8 2 14 6 14 14M25 46c8-2 14-6 14-14"/>'),
    "tool-assembly":    ("#38bdf8", '<rect x="14" y="14" width="16" height="16" rx="3"/><rect x="34" y="14" width="16" height="16" rx="3"/><rect x="14" y="34" width="16" height="16" rx="3"/><path d="M34 42h16M42 34v16"/>'),
    "tool-maps":        ("#f97316", '<path d="M34 42a9 9 0 00-9-9c0-1.5.4-2.9 1-4.2A9 9 0 1016 33a9 9 0 007 8.4V33z"/><circle cx="27" cy="24" r="3"/>'),
    "map":              ("#10b981", '<path d="M14 20l12-5 12 5 12-5v29l-12 5-12-5-12 5z"/><path d="M26 15v29M38 20v29"/>'),
    "growflow":         ("#22c55e", '<path d="M32 52V30"/><path d="M32 30c0-8 5-14 13-15 0 9-5 15-13 15z"/><path d="M32 38c0-7-5-12-12-13 0 8 5 13 12 13z"/><path d="M24 52h16"/>'),

    # ---- games ---------------------------------------------------------
    "ap-arcade":        ("#ff6b35", '<rect x="14" y="24" width="36" height="20" rx="9"/><path d="M22 31v6M19 34h6"/><circle cx="41" cy="31" r="2.5"/><circle cx="46" cy="36" r="2.5"/>'),
    "game-arcade":      ("#f97316", '<path d="M24 18h16v10h10a8 8 0 018 8v6a8 8 0 01-8 8H14a8 8 0 01-8-8v-6a8 8 0 018-8h10z"/><path d="M32 18V10"/><circle cx="46" cy="30" r="2"/><circle cx="52" cy="36" r="2"/><path d="M14 40h8M18 36v8"/>'),
    "game-neon-drift":  ("#06b6d4", '<path d="M12 40l4-10h32l4 10v6h-6a5 5 0 01-10 0H28a5 5 0 01-10 0h-6z"/><circle cx="20" cy="46" r="4"/><circle cx="44" cy="46" r="4"/><path d="M28 30l4-8h8"/>'),
    "game-open-world":  ("#84cc16", '<circle cx="32" cy="32" r="18"/><path d="M14 32h36M32 14c6 6 6 30 0 36-6-6-6-30 0-36z"/><path d="M24 24c5 3 11 3 16 0M24 40c5-3 11-3 16 0"/>'),
    "game-mario-gta6":  ("#ef4444", '<rect x="16" y="34" width="32" height="14" rx="4"/><path d="M20 34v-6a4 4 0 018 0v6M36 34v-6a4 4 0 018 0v6"/><circle cx="26" cy="41" r="2"/><circle cx="38" cy="41" r="2"/>'),
    "cartoon":          ("#fb7185", '<rect x="12" y="18" width="40" height="28" rx="5"/><path d="M26 32l12-6v12z"/><path d="M24 52l4-6M40 52l-4-6"/>'),

    # ---- docs / universe ------------------------------------------------
    "tour":             ("#38bdf8", '<path d="M32 12c-7 0-12 6-12 13 0 10 12 27 12 27s12-17 12-27c0-7-5-13-12-13z"/><circle cx="32" cy="25" r="5"/>'),
    "about":            ("#94a3b8", '<circle cx="32" cy="32" r="18"/><path d="M32 30v12M32 23v.01"/>'),
    "universe":         ("#818cf8", '<circle cx="32" cy="32" r="11"/><ellipse cx="32" cy="32" rx="20" ry="7" transform="rotate(-20 32 32)"/><path d="M15 18l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM49 44l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>'),

    # ---- services -------------------------------------------------------
    "svc-planet-earth": ("#22c55e", '<circle cx="32" cy="32" r="18"/><path d="M20 22c6 2 8 6 6 10s-6 4-6 10M44 22c-6 2-8 6-6 10s6 4 6 10M15 30h34M15 38h34"/>'),
    "svc-planet-news":  ("#0ea5e9", '<rect x="14" y="18" width="36" height="28" rx="4"/><path d="M20 26h16M20 32h16M20 38h10"/><rect x="38" y="30" width="8" height="12"/>'),
    "svc-planet-history": ("#a16207", '<path d="M22 14h20M22 14v10a10 10 0 0020 0V14M22 14l-4 6h8zM42 14l4 6h-8z"/><path d="M32 34v10M26 48h12"/>'),
    "svc-birds":        ("#14b8a6", '<path d="M14 38c8 0 12-4 16-10 2 8 8 12 16 12-6 4-10 6-16 6-8 0-12-3-16-8z"/><path d="M34 24a3 3 0 106 0 3 3 0 00-6 0z"/><circle cx="40" cy="23" r="1"/>'),
    "svc-hazoom-pod":   ("#f59e0b", '<path d="M32 14l16 8v20l-16 8-16-8V22z"/><path d="M32 14v36M16 22l16 8 16-8"/>'),
    "svc-os-desktop":   ("#0ea5e9", '<rect x="12" y="16" width="40" height="26" rx="4"/><path d="M25 50h14M32 42v8"/><path d="M20 24h10v8H20zM34 24h10v8H34zM20 36h24"/>'),
    "svc-collab-beat":  ("#ec4899", '<circle cx="24" cy="26" r="6"/><circle cx="42" cy="26" r="6"/><path d="M14 44c0-6 4-10 10-10s10 4 10 10"/><path d="M34 44c0-5 3-8 8-8s8 3 8 8"/>'),
    "svc-chatdev":      ("#8b5cf6", '<path d="M14 20a4 4 0 014-4h28a4 4 0 014 4v18a4 4 0 01-4 4H26l-10 8v-8h-2a2 2 0 01-2-2z"/><path d="M22 26h20M22 33h12"/>'),
    "svc-descer":       ("#64748b", '<path d="M32 12v28"/><path d="M22 30l10 10 10-10"/><circle cx="32" cy="16" r="5"/>'),
    "svc-sovereign":    ("#fbbf24", '<path d="M32 12l15 6v12c0 11-6 17-15 20-9-3-15-9-15-20V18z"/><path d="M32 24l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
    "svc-bouzelfa":     ("#d946ef", '<circle cx="32" cy="32" r="6"/><ellipse cx="32" cy="20" rx="6" ry="9"/><ellipse cx="32" cy="44" rx="6" ry="9"/><ellipse cx="20" cy="32" rx="9" ry="6"/><ellipse cx="44" cy="32" rx="9" ry="6"/>'),
    "svc-deepseek":     ("#3b82f6", '<circle cx="28" cy="28" r="14"/><path d="M38 38l12 12"/><path d="M22 24l6 4-6 4M32 34h6"/>'),
    "svc-jev":          ("#4ade80", '<path d="M36 12L22 36h10l-4 16 14-24H32z"/>'),
    "human-energy-construct": ("#f472b6", '<circle cx="32" cy="20" r="7"/><path d="M32 27v14M32 41l-8 10M32 41l8 10M20 34h24"/><path d="M44 16l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/>'),
}

TILE = (
    '<defs>'
    '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">'
    '<stop offset="0" stop-color="{c}" stop-opacity="0.30"/>'
    '<stop offset="0.55" stop-color="{c}" stop-opacity="0.10"/>'
    '<stop offset="1" stop-color="#04060c" stop-opacity="0.9"/>'
    '</linearGradient>'
    '</defs>'
    '<rect width="64" height="64" rx="14" fill="url(#g)"/>'
    '<rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.25" fill="none" '
    'stroke="{c}" stroke-opacity="0.55" stroke-width="1.5"/>'
    '<path d="M6 1h52a5 5 0 015 5v6H1V6a5 5 0 015-5z" fill="#ffffff" fill-opacity="0.06"/>'
)

GLYPH_STYLE = (
    'fill="none" stroke="#eafcff" stroke-width="2.6" '
    'stroke-linecap="round" stroke-linejoin="round"'
)


def render(app_id, accent, glyph):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" '
        'role="img" aria-label="{label}">'
        + TILE.format(c=accent)
        + '<g ' + GLYPH_STYLE + '>' + glyph + '</g>'
        + '</svg>'
    ).format(label=app_id.replace("-", " "))


def main():
    os.makedirs(OUT, exist_ok=True)
    for app_id, (accent, glyph) in sorted(ICONS.items()):
        svg = render(app_id, accent, glyph)
        with open(os.path.join(OUT, app_id + ".svg"), "w") as fh:
            fh.write(svg)
    print(f"generated {len(ICONS)} contextual icons -> {OUT}")


if __name__ == "__main__":
    main()

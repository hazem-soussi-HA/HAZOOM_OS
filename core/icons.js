'use strict';

/**
 * HAZOOM OS — Icon System
 *
 * Two families, split by optical budget rather than by taste:
 *
 *   TILE   assets/icons/*.svg   64x64, painted gradient tile with depth.
 *         Needs >= 40px to read. Used on the desktop and in the dock, where
 *         the glyph is --icon-glyph / --dock-glyph.
 *
 *   GLYPH  inline 24x24 line art, stroke-width 1.7, currentColor.
 *         Legible from 12px up and inherits the surrounding text colour, so
 *         it stays correct on hover, on the accent background, and in the
 *         dark titlebar. Used in window headers, start menu rows, context
 *         menus and alt-tab.
 *
 * The split exists because a 64px gradient tile forced into a 42px titlebar
 * gets cropped and muddy, while a 16px line glyph placed on the desktop
 * looks thin and unfinished. Neither family is wrong; using the wrong one at
 * a given size is.
 *
 * Every glyph shares viewBox "0 0 24 24" and stays inside a 2..22 live area
 * so that stroke-width never clips against the viewBox edge.
 */

const GLYPHS = {
    // ── shell / core ──────────────────────────────────────────
    kernel: '<path d="m9 3-1 3-3 1 2 3-2 3 3 1 1 3h6l1-3 3-1-2-3 2-3-3-1-1-3z"/><circle cx="12" cy="10" r="2"/>',
    system: '<rect x="3" y="4" width="14" height="12" rx="2"/><path d="M7 20h6M10 16v4M17 12h4M19 10v4"/>',
    dashboard: '<path d="M4 19V5M4 19h16"/><path d="m7 15 3-4 3 2 4-6"/>',
    display: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M7 12l3-3 2 2 4-4"/>',
    taskmgr: '<path d="M4 19V5M4 19h16"/><path d="M7 15h3v-4H7zM12 15h3V8h-3zM17 15h2V5h-2z"/>',
    computer: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    power: '<path d="M12 3v9"/><path d="M7 6a7 7 0 1 0 10 0"/>',

    // ── intelligence ──────────────────────────────────────────
    memory: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 5 3 3 0 0 0 5 1 3 3 0 0 0 5-1 3 3 0 0 0 2-5 3 3 0 0 0-1-5 3 3 0 0 0-3-3 3 3 0 0 0-6 0Z"/><path d="M9 8v8M15 8v8M9 12h6"/>',
    agent: '<rect x="5" y="6" width="14" height="12" rx="4"/><path d="M9 10h.01M15 10h.01M9 14h6M12 3v3M3 10h2M19 10h2"/>',
    model: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    atom: '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
    quantum: '<circle cx="12" cy="12" r="2"/><circle cx="12" cy="4" r="1.6"/><circle cx="12" cy="20" r="1.6"/><circle cx="4" cy="12" r="1.6"/><circle cx="20" cy="12" r="1.6"/><path d="M12 6v4M12 14v4M6 12h4M14 12h4"/>',
    brain: '<path d="M12 5a3 3 0 0 0-5.9-.7A3 3 0 0 0 4 7.5a3 3 0 0 0 .5 4.7A3 3 0 0 0 6 17.5 3 3 0 0 0 12 18z"/><path d="M12 5a3 3 0 0 1 5.9-.7A3 3 0 0 1 20 7.5a3 3 0 0 1-.5 4.7A3 3 0 0 1 18 17.5 3 3 0 0 1 12 18z"/><path d="M12 5v13"/>',
    mirror: '<path d="M12 3v18"/><path d="M9 7 4 12l5 5zM15 7l5 5-5 5"/>',
    deepthink: '<path d="M9 20h6M10 23h4"/><path d="M12 3a6 6 0 0 1 4 10.5V17H8v-3.5A6 6 0 0 1 12 3Z"/><path d="M9 10h6"/>',
    serotonin: '<path d="M12 21c-4 0-7-3-7-7 0-3 2-5 4-6 1 2 3 3 5 3 2 0 3-1 4-2 1 1 1 3 1 5 0 4-3 7-7 7Z"/><path d="M9 3c2 1 3 3 3 5"/>',
    aether: '<path d="M4 8c3-3 5 3 8 0s5-3 8 0"/><path d="M4 14c3-3 5 3 8 0s5-3 8 0"/><path d="M4 20c3-3 5 3 8 0s5-3 8 0"/>',
    sentinel: '<path d="M12 2 2 12l10 10 10-10z"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.5"/>',
    oracle: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.2-1.5 2.5M12 17h.01"/>',
    omega: '<path d="M12 2 4 22h16z"/><path d="M8 18h8M10 14h4M11 10h2"/>',
    construct: '<rect x="2" y="10" width="20" height="12" rx="1"/><path d="M6 10V4h12v6M6 22v-4h12v4"/><circle cx="12" cy="16" r="2"/>',

    // ── tools / files ─────────────────────────────────────────
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
    files: '<path d="M3 6h7l2 2h9v10H3z"/><path d="M3 8h18"/>',
    file: '<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    config: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="18" r="2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
    shield: '<path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="m8 12 2.5 2.5L16 9"/>',
    api: '<path d="M9 4H7a3 3 0 0 0-3 3v3M15 4h2a3 3 0 0 1 3 3v3M9 20H7a3 3 0 0 1-3-3v-3M15 20h2a3 3 0 0 0 3-3v-3"/><path d="M9 12h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    mesh: '<circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="m7 11 10-4M7 13l10 4"/>',
    github: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="9" r="2.5"/><path d="M6 8.5v7M8.4 7.2l7.2 1.3M8.4 16.8l7.2-1.3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    rocket: '<path d="M12 2c3 2 5 6 5 10l3 5h-4l-2 5-2-5H8l3-5c0-4 2-8 5-10z"/><circle cx="12" cy="9" r="2"/><path d="M10 17l-2 4M14 17l2 4"/>',
    build: '<path d="M14 7a4 4 0 1 0 5 5l-3 3-9 9-2-2 9-9z"/><path d="m9 11 4 4"/>',

    // ── world / nature ────────────────────────────────────────
    planet: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M5 7.5c4 2 10 2 14 0M5 16.5c4-2 10-2 14 0"/>',
    news: '<path d="M4 5h13v14H4z"/><path d="M17 9h3v8a2 2 0 0 1-3 2"/><path d="M7 9h7M7 12h7M7 15h4"/>',
    birds: '<path d="M3 14c4-6 10-8 14-6 3 1 4 4 2 6-2 2-6 1-8 3-2 2-6 1-8-3z"/><path d="M16 8l1-2 1 2"/><circle cx="17" cy="9" r=".5"/>',
    eyes: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/>',
    construct_earth: '<circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    drum: '<ellipse cx="12" cy="8" rx="9" ry="3"/><path d="M3 8v8c0 1.7 4 3 9 3s9-1.3 9-3V8"/><path d="m7 12 10 4M17 12l-10 4"/>',
    pod: '<path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/><path d="M9 11v5M15 11v5"/>',
    transistor: '<path d="M7 4h10v16H7z"/><path d="M4 8h3M4 16h3M17 8h3M17 16h3"/><path d="M10 9h4M10 12h4M10 15h2"/><path d="M9 20v2M15 20v2"/>',
    treasury: '<rect x="4" y="6" width="16" height="13" rx="2"/><path d="M7 6V4h10v2M8 10h8M8 14h5"/><circle cx="16" cy="14" r="1"/>',

    // ── creative / games ──────────────────────────────────────
    games: '<path d="M7 8h10a4 4 0 0 1 3.8 5.2l-1.2 3.5a2 2 0 0 1-3.3.8L14 15h-4l-2.3 2.5a2 2 0 0 1-3.3-.8l-1.2-3.5A4 4 0 0 1 7 8Z"/><path d="M7 11v4M5 13h4M16 12h.01M18 14h.01"/>',
    art: '<path d="m4 16 8.5-8.5 4 4L8 20H4z"/><path d="m13 7 2-2 4 4-2 2M4 20h5"/>',
    maze: '<path d="M4 4h6v4H8v8h4v-4h8v6H4z"/><path d="M12 4v4h4M4 20h16"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11L21 7H6"/>',
    energy: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',

    // ── generic ───────────────────────────────────────────────
    program: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    guide: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 5.5v15M8 7h8M8 11h8"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    library: '<path d="M4 5h5v15H4zM10 3h5v17h-5zM16 6h4v14h-4z"/>',
    science: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 16h8"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
    recent: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.7-4L3 9M3 4v5h5M4 13a8 8 0 0 0 14.7 4L21 15M21 20v-5h-5"/>',
    run: '<path d="m8 5 11 7-11 7z"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.2-1.5 2.5M12 17h.01"/>',
    user: '<circle cx="12" cy="8" r="3"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    matrix: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z"/>',
    perception: '<path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7z"/><circle cx="12" cy="12" r="3"/>'
};

/**
 * app id -> glyph name. Deliberately small: it only maps apps whose meaning is
 * unambiguous. Anything not listed falls back through ALIASES and then to
 * a monogram, so a new app never renders as a broken image.
 */
const GLYPH_MAP = {
    'svc-os-desktop': 'kernel',        'desktop': 'dashboard',
    'dashboard': 'dashboard',          'terminal': 'terminal',
    'file-manager': 'files',           'files': 'files',
    'settings': 'settings',            'api-settings': 'api',
    'deep-browser': 'globe',           'deepBrowser': 'globe',
    'browser': 'globe',                'navigator': 'compass',
    'antigravity': 'energy',           'map': 'planet',
    'user-guide': 'guide',             'tour': 'guide',
    'about': 'about',                  'console': 'terminal',
    'security-center': 'shield',       'security': 'shield',
    'hazoom-net': 'mesh',              'focus-timer': 'recent',
    'system-monitor': 'taskmgr',       'system_monitor': 'taskmgr',
    'consciousness-core': 'brain',     'ai': 'memory',
    'ai-intelligence': 'brain',        'ai-assistant': 'chat',
    'ai-hazoom-intel': 'brain',        'ai-general-intel': 'atom',
    'ai-deepthink': 'deepthink',       'ai-jev': 'agent',
    'ai-mirror': 'mirror',             'ai-quantum': 'quantum',
    'ai-serotonin': 'serotonin',       'ai-super': 'oracle',
    'deep-think': 'deepthink',
    'svc-planet-earth': 'planet',      'svc-planet-news': 'news',
    'svc-planet-history': 'recent',    'svc-birds': 'birds',
    'svc-hazoom-pod': 'pod',           'svc-collab-beat': 'music',
    'svc-chatdev': 'chat',             'svc-jev': 'agent',
    'svc-sovereign': 'treasury',       'svc-bouzelfa': 'user',
    'svc-deepseek': 'library',         'svc-descer': 'drum',
    'descer': 'drum',
    'tool-github-bridge': 'github',    'github-bridge': 'github',
    'tool-assembly': 'construct_earth', 'assembly': 'construct_earth',
    'tool-maps': 'planet',             'maps': 'planet',
    'tool-terminal': 'terminal',       'tool-files': 'files',
    'tool-settings': 'settings',       'tool-deep-browser': 'globe',
    'game-arcade': 'games',            'ap-arcade': 'games', 'arcade': 'games',
    'game-open-world': 'maze',         'open-world': 'maze',
    'game-mario-gta6': 'rocket',       'mario-gta6': 'rocket',
    'game-neon-drift': 'energy',       'neon-drift': 'energy',
    'human-energy-construct': 'perception', 'human-energy': 'perception',
    'quantum-monitor': 'quantum',      'quantum-lab': 'atom',
    'quantum-travel': 'rocket',        'universe': 'atom',
    'growflow': 'energy',              'cartoon': 'art',
    'prompt-engineering': 'guide',     'tool-transistor-studio': 'transistor',
    'transistor-studio': 'transistor'
};

const ALIASES = {
    terminal: 'terminal', shell: 'terminal', console: 'terminal', bash: 'terminal',
    files: 'files', folder: 'files', filemanager: 'files', explorer: 'files',
    settings: 'settings', prefs: 'settings', config: 'config', gear: 'settings',
    browser: 'globe', web: 'globe', net: 'mesh', network: 'mesh', internet: 'globe',
    ai: 'memory', brain: 'brain', mind: 'brain', intel: 'brain', agent: 'agent',
    chat: 'chat', message: 'chat', mail: 'chat', music: 'music', audio: 'music',
    drum: 'drum', beat: 'music', pod: 'pod', shop: 'pod', store: 'cart', cart: 'cart',
    planet: 'planet', earth: 'planet', world: 'planet', map: 'planet', globe: 'globe',
    game: 'games', games: 'games', arcade: 'games', play: 'play',
    security: 'shield', shield: 'shield', lock: 'shield', guard: 'sentinel',
    github: 'github', git: 'github', code: 'github', repo: 'github',
    build: 'build', deploy: 'rocket', rocket: 'rocket', run: 'run', start: 'run',
    monitor: 'taskmgr', system: 'system', kernel: 'kernel', core: 'kernel',
    quantum: 'quantum', atom: 'atom', matrix: 'matrix', aether: 'aether',
    deepthink: 'deepthink', mirror: 'mirror', oracle: 'oracle', omega: 'omega',
    construct: 'construct', sentinel: 'sentinel', perception: 'perception',
    birds: 'birds', news: 'news', guide: 'guide', about: 'about', user: 'user',
    library: 'library', science: 'science', compass: 'compass', recent: 'recent',
    refresh: 'refresh', help: 'help', art: 'art', maze: 'maze', program: 'program',
    desktop: 'dashboard', os: 'kernel', app: 'program', apps: 'program',
    pod_shop: 'pod', sovereign: 'treasury', assembly: 'construct_earth'
};

const STROKE = 1.7;

/** Resolve anything (id, name, glyph key) to a known glyph name. */
function resolveGlyph(value) {
    const key = String(value == null ? '' : value).trim().toLowerCase();
    if (!key) return null;
    if (GLYPHS[key]) return key;
    if (ALIASES[key]) return ALIASES[key];
    // last resort: walk the key right-to-left and take the first part that
    // names a glyph or an alias
    // ("svc-hazoom-pod" -> "pod", "tool-github-bridge" -> "github")
    const tail = key.split(/[-_/:.\s]+/).filter(Boolean);
    for (let i = tail.length - 1; i >= 0; i--) {
        if (GLYPHS[tail[i]]) return tail[i];
        if (ALIASES[tail[i]]) return ALIASES[tail[i]];
    }
    return null;
}

/**
 * Inline line-art glyph. currentColor so it inherits the text colour of
 * whatever it sits inside — titlebar, menu row, context item, alt-tab card.
 */
function glyph(value, opts) {
    const o = opts || {};
    const name = resolveGlyph(o.force || value) || (GLYPHS.program ? 'program' : null);
    const body = GLYPHS[name] || '';
    const cls = 'hz-glyph' + (o.className ? ' ' + o.className : '');
    const size = o.size ? ' style="width:' + o.size + ';height:' + o.size + '"' : '';
    return '<svg class="' + cls + '"' + size
        + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'
        + (o.weight || STROKE) + '" stroke-linecap="round" stroke-linejoin="round"'
        + ' aria-hidden="true" focusable="false">' + body + '</svg>';
}

/** The glyph an app should show, or null when only a tile exists for it. */
function glyphForApp(app) {
    if (!app) return null;
    if (app.glyph) return resolveGlyph(app.glyph);
    const byId = resolveGlyph(GLYPH_MAP[app.id]);
    if (byId) return byId;
    const byName = resolveGlyph(String(app.name || '').toLowerCase().replace(/\s+/g, '-'));
    return byName;
}

const HAZOOM_ICONS = {
    GLYPHS, GLYPH_MAP, ALIASES, STROKE,
    resolveGlyph, glyph, glyphForApp,
    count: Object.keys(GLYPHS).length
};

if (typeof window !== 'undefined') window.HAZOOM_ICONS = HAZOOM_ICONS;
if (typeof module !== 'undefined' && module.exports) module.exports = HAZOOM_ICONS;

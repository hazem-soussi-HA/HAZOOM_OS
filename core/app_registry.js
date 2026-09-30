// HAZOOM OS - Central App Registry
(function (window) {
    if (!window) return;
    if (window.AppRegistry) return; // Already defined

    const ICON_MAP = {
        dashboard: 'D', terminal: '>_', ai: 'AI', files: 'F', browser: 'B', deepBrowser: 'DB',
        music: 'FM', descer: 'DR', settings: 'SET', 'api-settings': 'API', navigator: 'NAV',
        antigravity: 'AG', 'consciousness-core': 'CS', 'quantum-travel': 'QT', 'prompt-engineering': 'PE',
        cartoon: 'TV', about: 'i', tour: 'T', universe: 'U', 'system-monitor': 'SM',
        'hazoom-net': 'NET', 'focus-timer': 'FT', 'user-guide': 'UG', map: 'MAP', growflow: 'GF',
        'ap-arcade': 'GA', 'game-neon-drift': 'ND', 'svc-planet-earth': 'PE', 'svc-planet-news': 'PN',
        'svc-planet-history': 'PH', 'svc-birds': 'BE', 'svc-hazoom-pod': 'POD', 'svc-os-desktop': 'OS',
        'svc-collab-beat': 'CB', 'svc-chatdev': 'OC', 'svc-descer': 'DR', 'svc-sovereign': 'SS',
        'svc-bouzelfa': 'BZ', 'svc-deepseek': 'DK', 'svc-jev': 'JEV', 'ai-intelligence': 'AI',
        'ai-jev': 'JEV', 'ai-hazoom-intel': 'HI', 'ai-general-intel': 'GI', 'ai-serotonin': 'SE',
        'ai-mirror': 'MT', 'ai-quantum': 'QA', 'ai-super': 'SA', 'ai-deepthink': 'DT',
        'game-open-world': 'OW', 'game-mario-gta6': 'MG', 'game-arcade': 'AR', 'tool-terminal': 'TM',
        'tool-files': 'FM', 'tool-settings': 'ST', 'tool-deep-browser': 'DB', 'tool-github-bridge': 'GB',
        'tool-assembly': 'ASM', 'tool-maps': 'MAP', 'human-energy-construct': 'HE'
    };
    const CATEGORY_ICONS = { services: 'SVC', ai: 'AI', games: 'GAME', tools: 'TOOL', docs: 'DOC', visualizers: 'VIS' };
    const resolveIcon = (id, name, category) => {
        if (window.HAZOOM && typeof window.HAZOOM.appIcon === 'function') return window.HAZOOM.appIcon({ id, name, category });
        if (ICON_MAP[id]) return ICON_MAP[id];
        if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
        return String(name || id || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase().slice(0, 2) || '?';
    };

    const Registry = {
        meta: {},        // simple meta entries: { name, icon }
        configs: {},     // full app configs used by launcher
        desktopApps: [],

        registerApp: function (id, def) {
            if (!id) return false;
            // If def has getContent or content or title -> treat as full config
            const isConfig = def && (typeof def.getContent === 'function' || def.content || def.title);
            if (isConfig) {
                this.configs[id] = def;
                // ensure meta exists
                if (!this.meta[id]) this.meta[id] = { name: def.title || id, icon: resolveIcon(id, def.title || id, def.category) };
            } else if (def && (def.name || def.icon)) {
                this.meta[id] = { name: def.name || id, icon: resolveIcon(id, def.name || id, def.category) };
            } else {
                // minimal registration
                if (!this.meta[id]) this.meta[id] = { name: id, icon: resolveIcon(id, id, '') };
            }
            if (!this.desktopApps.includes(id)) this.desktopApps.push(id);
            // Emit a simple event if HAZOOM.System exists
            try { if (window.System && typeof window.System.emit === 'function') window.System.emit('appRegistered', { id }); } catch (e) { }
            return true;
        },

        getMeta: function (id) { return this.meta[id] || null; },
        getConfig: function (id) { return this.configs[id] || null; },
        getAppList: function () { return Array.from(this.desktopApps); },

        // Utility: bulk register from existing core 'apps' structure
        importFromCoreApps: function (coreApps) {
            if (!coreApps) return;
            if (Array.isArray(coreApps.desktopApps)) this.desktopApps = Array.from(new Set(this.desktopApps.concat(coreApps.desktopApps)));
            Object.keys(coreApps).forEach(key => {
                if (key === 'desktopApps') return;
                const entry = coreApps[key];
                if (entry && typeof entry === 'object') {
                    if (!this.meta[key]) {
                        this.meta[key] = { name: entry.name || entry.title || key, icon: resolveIcon(key, entry.name || entry.title || key, entry.category) };
                    }
                }
            });
        }
    };

    window.AppRegistry = Registry;

    // === AUTO-REGISTER ALPHA PONY INTEGRATED APPS ===
    const apApps = [
        { id: 'ap-arcade', name: 'Retro Arcade', icon: '🕹️' },
        { id: 'ap-voice-chat', name: 'Voice Chat', icon: '🎙️' },
        { id: 'ap-web-chat', name: 'Web Chat', icon: '💬' },
        { id: 'ap-meeting', name: 'Meeting Scheduler', icon: '📅' },
        { id: 'ap-mcp-monitor', name: 'MCP Monitor', icon: '🔍' },
        { id: 'ap-admin-panel', name: 'Admin Panel', icon: '⚙️' },
        { id: 'ap-ledger', name: 'Ledger Pro', icon: '📊' },
        { id: 'ap-control-center', name: 'Control Center', icon: '🎛️' },
        { id: 'ap-process-viz', name: 'Process Visualizer', icon: '🧠' },
    ];
    apApps.forEach(a => Registry.registerApp(a.id, { name: a.name, icon: a.icon }));

    // === REGISTER DEEP BROWSER (inner-internet explorer) ===
    Registry.registerApp('tool-deep-browser', { name: 'Deep Browser', icon: '🜂' });

    // === REGISTER GITHUB BRIDGE (real-time OS ↔ GitHub observation) ===
    Registry.registerApp('tool-github-bridge', { name: 'GitHub Bridge', icon: '🔗' });

    // === REGISTER GAMES ===
    var gameApps = [
        { id: 'game-smg6', name: 'Super Mario GTA6', icon: '🍄' },
        { id: 'game-neon-drift', name: 'Neon Drift', icon: '🏎️' },
        { id: 'game-chess', name: 'Chess', icon: '♟️' },
        { id: 'game-arcade', name: 'Arcade', icon: '🕹️' },
    ];
    gameApps.forEach(function(a) { Registry.registerApp(a.id, { name: a.name, icon: a.icon }); });

    // === REGISTER VISUALIZERS ===
    var visualizerApps = [
        { id: 'human-energy-construct', name: 'Human Energy Construct', icon: '⚡', url: '/apps/visualizers/human-energy/index.html' },
    ];
    visualizerApps.forEach(function(a) {
        Registry.registerApp(a.id, { name: a.name, icon: a.icon });
        if (a.url) { try { Registry.meta[a.id] = Registry.meta[a.id] || {}; Registry.meta[a.id].url = a.url; } catch (e) {} }
    });

    // === REGISTER INTEGRATED FULLSTACK SERVICES (launched by HAZOOM OS) ===
    var osServices = [
        { id: 'svc-planet-earth', name: 'Planet Earth', icon: '🌍', url: 'http://127.0.0.1:8080/' },
        { id: 'svc-planet-news',  name: 'Planet Earth News', icon: 'PN', url: 'http://127.0.0.1:8001/' },
        { id: 'svc-birds',         name: 'Birds Encyclopedia', icon: '🐦', url: 'http://127.0.0.1:4100/' },
        { id: 'svc-hazoom-pod',    name: 'Hazoom POD', icon: '🛒', url: 'http://127.0.0.1:4000/' },
        { id: 'svc-os-desktop',    name: 'HAZOOM OS Desktop', icon: '🖥️', url: 'http://127.0.0.1:3000/' },
        { id: 'svc-collab-beat',   name: 'CollaborativeBeat', icon: '🧠', url: 'http://127.0.0.1:5000/' },
        { id: 'svc-chatdev',       name: 'Ornith Chat', icon: '💬', url: 'http://127.0.0.1:5055/' },
    ];
    osServices.forEach(function(a) {
        Registry.registerApp(a.id, { name: a.name, icon: a.icon });
        if (a.url) { try { Registry.meta[a.id] = Registry.meta[a.id] || {}; Registry.meta[a.id].url = a.url; } catch (e) {} }
    });
})(window);


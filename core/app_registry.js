// HAZOOM OS - Central App Registry
(function (window) {
    if (!window) return;
    if (window.AppRegistry) return; // Already defined

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
                if (!this.meta[id]) this.meta[id] = { name: def.title || id, icon: def.icon || '📱' };
            } else if (def && (def.name || def.icon)) {
                this.meta[id] = { name: def.name || id, icon: def.icon || '📱' };
            } else {
                // minimal registration
                if (!this.meta[id]) this.meta[id] = { name: id, icon: '📱' };
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
                        this.meta[key] = { name: entry.name || entry.title || key, icon: entry.icon || '📱' };
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

    // === REGISTER GAMES ===
    var gameApps = [
        { id: 'game-smg6', name: 'Super Mario GTA6', icon: '🍄' },
        { id: 'game-neon-drift', name: 'Neon Drift', icon: '🏎️' },
        { id: 'game-chess', name: 'Chess', icon: '♟️' },
        { id: 'game-arcade', name: 'Arcade', icon: '🕹️' },
    ];
    gameApps.forEach(function(a) { Registry.registerApp(a.id, { name: a.name, icon: a.icon }); });
})(window);


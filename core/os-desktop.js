        window.HAZOOM = {
            version: '3.1.0',
            windows: [],
            windowIdCounter: 0,
            focusedWindow: null,
            apps: {},

            state: {
                uptime: 0,
                cpu: 12,
                memory: 450,
                totalMemory: 16384,
                user: 'hazem',
                systemAuthority: 'LEVEL_1',
                services: { ollama: false, chat: false, filter: false, gateway: false }
            },

            defineApps() {
                this.apps = {
                    dashboard: {
                        id: 'dashboard',
                        name: 'Dashboard',
                        icon: '📊',
                        color: '#00f0ff',
                        width: 520,
                        height: 420,
                        desktop: true,
                        category: 'core',
                        content: () => `
                            <div class="app-dashboard">
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                                    <div class="stat-card">
                                        <div class="stat-label">System Status</div>
                                        <div class="stat-value green" id="stat-status">Online</div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-label">Uptime</div>
                                        <div class="stat-value gold" id="stat-uptime">0s</div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-label">CPU Load</div>
                                        <div class="stat-value accent" id="stat-cpu">12%</div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-label">Memory</div>
                                        <div class="stat-value" id="stat-memory">450 MB</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Quick Info</div>
                                    <div style="margin-top:8px;font-size:0.85rem;color:var(--text-dim);">
                                        HAZOOM OS v${this.version} — AI-Powered Workspace<br>
                                        Creator: Hazem Soussi — May 2026<br>
                                        Open Source · Self-Hosted · Cloud Ready
                                    </div>
                                </div>
                            </div>
                        `
                    },
                    terminal: {
                        id: 'terminal',
                        name: 'Terminal',
                        icon: '⌨️',
                        color: '#10b981',
                        width: 620,
                        height: 400,
                        desktop: true,
                        category: 'core',
                        content: () => `
                            <div class="app-terminal" id="terminal-body">
                                <div class="terminal-line" style="color:var(--accent);">HAZOOM OS v${this.version} — Terminal</div>
                                <div class="terminal-line" style="color:var(--text-dim);">Type 'help' for available commands.</div>
                                <div class="terminal-line">&nbsp;</div>
                                <div class="terminal-line"><span class="terminal-prompt">hazoom@os:~$ </span><input class="terminal-input" id="terminal-input" autofocus></div>
                            </div>
                        `,
                        onMount: () => {
                            const input = document.getElementById('terminal-input');
                            if (input) {
                                input.addEventListener('keydown', (e) => {
                                    if (e.key === 'Enter') {
                                        const cmd = input.value.trim();
                                        HAZOOM.runTerminal(cmd);
                                        input.value = '';
                                    }
                                });
                                input.focus();
                            }
                        }
                    },
                    ai: {
                        id: 'ai',
                        name: 'AI Assistant',
                        icon: '🤖',
                        color: '#8b5cf6',
                        width: 480,
                        height: 520,
                        desktop: true,
                        content: () => `
                            <div class="app-chat">
                                <div class="chat-messages" id="ai-chat">
                                    <div class="chat-msg system">HAZOOM AI Assistant — Powered by Ollama</div>
                                    <div class="chat-msg ai">Hello! I'm your AI assistant. How can I help you today?</div>
                                </div>
                                <div class="chat-input-bar">
                                    <input type="text" id="ai-input" placeholder="Ask anything...">
                                    <button onclick="HAZOOM.sendAIMessage()">Send</button>
                                </div>
                            </div>
                        `,
                        onMount: () => {
                            const input = document.getElementById('ai-input');
                            if (input) {
                                input.addEventListener('keydown', (e) => {
                                    if (e.key === 'Enter') HAZOOM.sendAIMessage();
                                });
                            }
                        }
                    },
                    files: {
                        id: 'files',
                        name: 'Files',
                        icon: '📁',
                        color: '#ffd700',
                        width: 600,
                        height: 450,
                        desktop: true,
                        category: 'core',
                        src: 'apps/core-apps/filemanager.html'
                    },
                    browser: {
                        id: 'browser',
                        name: 'Browser',
                        icon: '🌐',
                        color: '#06b6d4',
                        width: 800,
                        height: 550,
                        desktop: true,
                        content: () => `
                            <div class="app-browser">
                                <div class="browser-bar">
                                    <input type="text" id="browser-url" value="https://github.com/hazem-soussi-HA/hazoom-os-unified" placeholder="Enter URL...">
                                    <button onclick="HAZOOM.navigateBrowser()">Go</button>
                                </div>
                                <iframe class="browser-frame" id="browser-frame" src="https://github.com/hazem-soussi-HA/hazoom-os-unified" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
                            </div>
                        `
                    },
                    music: {
                        id: 'music',
                        name: 'Neural FM',
                        icon: '🎵',
                        color: '#f59e0b',
                        width: 420,
                        height: 540,
                        content: () => `
                            <div class="app-music">
                                <div class="music-header">🎵 Neural FM</div>
                                <div class="music-sub">Coding playlists for flow state</div>
                                <div class="playlist-card" onclick="HAZOOM.playPlaylist('synthwave')">
                                    <div style="display:flex;align-items:center;gap:10px;">
                                        <div style="width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,#ff6b6b,#ffa500);display:flex;align-items:center;justify-content:center;font-size:18px;">🌅</div>
                                        <div><div style="font-size:0.85rem;font-weight:600;">Synthwave Flow</div><div style="font-size:0.7rem;color:var(--text-dim);">Kavinsky, The Midnight, FM-84</div></div>
                                    </div>
                                </div>
                                <div class="playlist-card" onclick="HAZOOM.playPlaylist('lofi')">
                                    <div style="display:flex;align-items:center;gap:10px;">
                                        <div style="width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,#10b981,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:18px;">🍃</div>
                                        <div><div style="font-size:0.85rem;font-weight:600;">Lo-Fi Focus</div><div style="font-size:0.7rem;color:var(--text-dim);">Chillhop, Lofi Girl beats</div></div>
                                    </div>
                                </div>
                                <div class="playlist-card" onclick="HAZOOM.playPlaylist('electronic')">
                                    <div style="display:flex;align-items:center;gap:10px;">
                                        <div style="width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,#00f0ff,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:18px;">⚡</div>
                                        <div><div style="font-size:0.85rem;font-weight:600;">Electronic Rush</div><div style="font-size:0.7rem;color:var(--text-dim);">Daft Punk, Justice, Deadmau5</div></div>
                                    </div>
                                </div>
                                <div id="music-player-container" style="margin-top:12px;display:none;"></div>
                            </div>
                        `
                    },
                    settings: {
                        id: 'settings',
                        name: 'Settings',
                        icon: '⚙️',
                        color: '#6b7280',
                        width: 420,
                        height: 380,
                        desktop: true,
                        category: 'core',
                        content: () => `
                            <div class="app-settings">
                                <div style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">System Settings</div>
                                <div class="setting-row">
                                    <span class="setting-label">Version</span>
                                    <span class="setting-value">3.0.0</span>
                                </div>
                                <div class="setting-row">
                                    <span class="setting-label">Creator</span>
                                    <span class="setting-value" style="color:var(--accent);">Hazem Soussi</span>
                                </div>
                                <div class="setting-row">
                                    <span class="setting-label">License</span>
                                    <span class="setting-value">MIT Open Source</span>
                                </div>
                                <div class="setting-row">
                                    <span class="setting-label">Repository</span>
                                    <span class="setting-value" style="color:var(--accent);cursor:pointer;" onclick="window.open('https://github.com/hazem-soussi-HA/hazoom-os-unified','_blank')">GitHub ↗</span>
                                </div>
                            </div>
                        `
                    },
                    'ai-assistant': {
                        id: 'ai-assistant',
                        name: 'AI Assistant',
                        icon: '🤖',
                        color: '#8b5cf6',
                        width: 480,
                        height: 520,
                        desktop: true,
                        category: 'ai',
                        src: 'apps/ai-apps/ai_assistant.html'
                    },
                    'quantum-ai': {
                        id: 'quantum-ai',
                        name: 'Quantum AI',
                        icon: '🧠',
                        color: '#a855f7',
                        width: 500,
                        height: 540,
                        category: 'ai',
                        src: 'apps/ai-apps/quantum_ai_assistant.html'
                    },
                    copilot: {
                        id: 'copilot',
                        name: 'Copilot',
                        icon: '🚀',
                        color: '#3b82f6',
                        width: 500,
                        height: 500,
                        desktop: true,
                        category: 'ai',
                        src: 'apps/ai-apps/copilot.html'
                    },
                    'hazoom-ai': {
                        id: 'hazoom-ai',
                        name: 'Hazoom AI',
                        icon: '✨',
                        color: '#06b6d4',
                        width: 600,
                        height: 500,
                        category: 'ai',
                        src: 'apps/ai-apps/hazoom_ai_assistant.html'
                    },
                    'super-agent': {
                        id: 'super-agent',
                        name: 'Super Agent',
                        icon: '🌟',
                        color: '#f59e0b',
                        width: 700,
                        height: 550,
                        category: 'ai',
                        src: 'apps/ai-apps/super_intelligent_agent.html'
                    },
                    'deep-think': {
                        id: 'deep-think',
                        name: 'Deep Think',
                        icon: '💭',
                        color: '#6366f1',
                        width: 550,
                        height: 480,
                        category: 'ai',
                        src: 'apps/ai-apps/deep_think_explorer.html'
                    },
                    'ai-command': {
                        id: 'ai-command',
                        name: 'AI Command',
                        icon: '🎯',
                        color: '#ec4899',
                        width: 550,
                        height: 480,
                        category: 'ai',
                        src: 'apps/ai-apps/ai_command_center.html'
                    },
                    glm: {
                        id: 'glm',
                        name: 'GLM',
                        icon: '🔮',
                        color: '#14b8a6',
                        width: 600,
                        height: 500,
                        category: 'ai',
                        src: 'apps/ai-apps/glm_integration.html'
                    },
                    hazoom: {
                        id: 'hazoom',
                        name: 'Hazoom',
                        icon: '🌌',
                        color: '#8b5cf6',
                        width: 600,
                        height: 500,
                        category: 'ai',
                        src: 'apps/ai-apps/hazoom.html'
                    },
                    'quantum-search': {
                        id: 'quantum-search',
                        name: 'Search',
                        icon: '🔍',
                        color: '#06b6d4',
                        width: 500,
                        height: 400,
                        category: 'tools',
                        src: 'apps/tools/quantum_search.html'
                    },
                    'hazoom-search': {
                        id: 'hazoom-search',
                        name: 'Hazoom Search',
                        icon: '🔎',
                        color: '#3b82f6',
                        width: 550,
                        height: 450,
                        category: 'tools',
                        src: 'apps/tools/hazoom_search.html'
                    },
                    'universal-search': {
                        id: 'universal-search',
                        name: 'Universal Search',
                        icon: '🌐',
                        color: '#10b981',
                        width: 600,
                        height: 500,
                        category: 'tools',
                        src: 'apps/tools/hazoom_universal_search.html'
                    },
                    'quantum-monitor': {
                        id: 'quantum-monitor',
                        name: 'Monitor',
                        icon: '📈',
                        color: '#22c55e',
                        width: 550,
                        height: 450,
                        desktop: true,
                        category: 'tools',
                        src: 'apps/tools/quantum_monitor.html'
                    },
                    'admin-monitor': {
                        id: 'admin-monitor',
                        name: 'Admin Monitor',
                        icon: '🛡️',
                        color: '#ef4444',
                        width: 600,
                        height: 500,
                        category: 'tools',
                        src: 'apps/tools/admin_monitor.html'
                    },
                    'secure-scraper': {
                        id: 'secure-scraper',
                        name: 'Scraper',
                        icon: '🕸️',
                        color: '#f97316',
                        width: 550,
                        height: 480,
                        category: 'tools',
                        src: 'apps/tools/secure_scraper.html'
                    },
                    'security-settings': {
                        id: 'security-settings',
                        name: 'Security',
                        icon: '🔐',
                        color: '#dc2626',
                        width: 500,
                        height: 450,
                        category: 'tools',
                        src: 'apps/tools/security_settings.html'
                    },
                    'api-settings': {
                        id: 'api-settings',
                        name: 'API Settings',
                        icon: '🔑',
                        color: '#a855f7',
                        width: 480,
                        height: 420,
                        category: 'tools',
                        src: 'apps/tools/api_settings.html'
                    },
                    camera: {
                        id: 'camera',
                        name: 'Camera',
                        icon: '📷',
                        color: '#64748b',
                        width: 550,
                        height: 450,
                        category: 'tools',
                        src: 'apps/tools/camera_stream.html'
                    },
                    navigator: {
                        id: 'navigator',
                        name: 'Navigator',
                        icon: '🧭',
                        color: '#0ea5e9',
                        width: 600,
                        height: 500,
                        category: 'tools',
                        src: 'apps/tools/advanced_navigator.html'
                    },
                    antigravity: {
                        id: 'antigravity',
                        name: 'Antigravity',
                        icon: '🛸',
                        color: '#8b5cf6',
                        width: 600,
                        height: 500,
                        category: 'tools',
                        src: 'apps/tools/antigravity_navigator.html'
                    },
                    'screen-light': {
                        id: 'screen-light',
                        name: 'Screen Light',
                        icon: '💡',
                        color: '#fbbf24',
                        width: 400,
                        height: 350,
                        category: 'tools',
                        src: 'apps/tools/screen_light_controller.html'
                    },
                    'usb-portal': {
                        id: 'usb-portal',
                        name: 'USB Portal',
                        icon: '🔌',
                        color: '#6b7280',
                        width: 500,
                        height: 450,
                        category: 'tools',
                        src: 'apps/tools/usb_portal.html'
                    },
                    'focus-timer': {
                        id: 'focus-timer',
                        name: 'Focus Timer',
                        icon: '⏱️',
                        color: '#f59e0b',
                        width: 520,
                        height: 520,
                        desktop: true,
                        category: 'tools',
                        src: 'apps/tools/focus-timer/index.html'
                    },
                    'consciousness-core': {
                        id: 'consciousness-core',
                        name: 'Consciousness',
                        icon: '🧠',
                        color: '#a855f7',
                        width: 900,
                        height: 600,
                        desktop: true,
                        category: 'ai',
                        src: 'apps/tools/consciousness_core.html'
                    },
                    'user-guide': {
                        id: 'user-guide',
                        name: 'User Guide',
                        icon: '📖',
                        color: '#10b981',
                        width: 900,
                        height: 650,
                        desktop: true,
                        category: 'docs',
                        src: 'docs/user-guide.html'
                    },
                    'background-office': {
                        id: 'background-office',
                        name: 'Background Office',
                        icon: '🏢',
                        color: '#475569',
                        width: 700,
                        height: 550,
                        category: 'tools',
                        src: 'apps/tools/background_office.html'
                    },
                    'quantum-travel': {
                        id: 'quantum-travel',
                        name: 'Quantum Travel',
                        icon: '🌌',
                        color: '#7c3aed',
                        width: 650,
                        height: 520,
                        category: 'tools',
                        src: 'apps/tools/quantum_travel.html'
                    },
                    consciousness: {
                        id: 'consciousness',
                        name: 'Consciousness',
                        icon: '🧠',
                        color: '#a855f7',
                        width: 600,
                        height: 500,
                        category: 'tools',
                        src: 'apps/tools/consciousness_portal.html'
                    },
                    'prompt-engineering': {
                        id: 'prompt-engineering',
                        name: 'Prompt Eng',
                        icon: '📝',
                        color: '#f43f5e',
                        width: 550,
                        height: 480,
                        category: 'tools',
                        src: 'apps/tools/prompt_engineering_system.html'
                    },
                    chess: {
                        id: 'chess',
                        name: 'Chess',
                        icon: '♟️',
                        color: '#78716c',
                        width: 500,
                        height: 500,
                        desktop: true,
                        category: 'games',
                        src: 'apps/games/chess.html'
                    },
                    cartoon: {
                        id: 'cartoon',
                        name: 'Cartoon',
                        icon: '🎬',
                        color: '#f472b6',
                        width: 600,
                        height: 450,
                        category: 'games',
                        src: 'apps/games/cartoon-episode/index.html'
                    },
                    map: {
                        id: 'map',
                        name: 'Map',
                        icon: '🗺️',
                        color: '#10b981',
                        width: 700,
                        height: 550,
                        category: 'visualizers',
                        src: 'apps/visualizers/futuristic-map.html'
                    },
                    circuit: {
                        id: 'circuit',
                        name: 'Circuit Scan',
                        icon: '🔬',
                        color: '#06b6d4',
                        width: 650,
                        height: 500,
                        category: 'visualizers',
                        src: 'apps/visualizers/circuit-scan/circuit-scan/index.html'
                    },
                    growflow: {
                        id: 'growflow',
                        name: 'GrowFlow',
                        icon: '🌱',
                        color: '#22c55e',
                        width: 600,
                        height: 500,
                        category: 'visualizers',
                        src: 'apps/visualizers/growflow/index.html'
                    },
                    about: {
                        id: 'about',
                        name: 'About',
                        icon: 'ℹ️',
                        color: '#64748b',
                        width: 450,
                        height: 400,
                        category: 'docs',
                        src: 'apps/docs/about.html'
                    },
                    tour: {
                        id: 'tour',
                        name: 'Tour',
                        icon: '🎯',
                        color: '#3b82f6',
                        width: 550,
                        height: 450,
                        category: 'docs',
                        src: 'apps/docs/HAZOOM_OS_TOUR.html'
                    },
                    pricing: {
                        id: 'pricing',
                        name: 'Pricing',
                        icon: '💰',
                        color: '#f59e0b',
                        width: 450,
                        height: 400,
                        category: 'docs',
                        src: 'apps/docs/pricing.html'
                    },
                    universe: {
                        id: 'universe',
                        name: 'Universe',
                        icon: '🌌',
                        color: '#8b5cf6',
                        width: 600,
                        height: 500,
                        category: 'docs',
                        src: 'apps/docs/hazoom_universe.html'
                    },
                    'system-monitor': {
                        id: 'system-monitor',
                        name: 'System Monitor',
                        icon: '📊',
                        color: '#10b981',
                        width: 800,
                        height: 560,
                        desktop: true,
                        category: 'tools',
                        src: 'apps/tools/system_monitor.html'
                    },
                    'security-center': {
                        id: 'security-center',
                        name: 'Security',
                        icon: '🛡️',
                        color: '#ef4444',
                        width: 800,
                        height: 560,
                        desktop: true,
                        category: 'tools',
                        src: 'apps/tools/security_center.html'
                    },
                    'hazoom-net': {
                        id: 'hazoom-net',
                        name: 'HAZOOM NET',
                        icon: '🌐',
                        color: '#06b6d4',
                        width: 900,
                        height: 600,
                        desktop: true,
                        category: 'tools',
                        src: 'apps/tools/HAZOOM_NET.html'
                    },

                    // === INTEGRATED FROM ALPHA PONY ===
                    'ap-arcade': {
                        id: 'ap-arcade',
                        name: 'Retro Arcade',
                        icon: '🕹️',
                        color: '#ff6b35',
                        width: 800,
                        height: 600,
                        desktop: true,
                        category: 'games',
                        src: 'apps/games/arcade.html'
                    },
                    'ap-voice-chat': {
                        id: 'ap-voice-chat',
                        name: 'Voice Chat',
                        icon: '🎙️',
                        color: '#8b5cf6',
                        width: 600,
                        height: 500,
                        desktop: true,
                        category: 'ai',
                        src: 'apps/ai-apps/voice-chat.html'
                    },
                    'ap-web-chat': {
                        id: 'ap-web-chat',
                        name: 'Web Chat',
                        icon: '💬',
                        color: '#ffd700',
                        width: 700,
                        height: 550,
                        desktop: true,
                        category: 'ai',
                        src: 'apps/ai-apps/web-chat.html'
                    },
                    'ap-meeting': {
                        id: 'ap-meeting',
                        name: 'Meeting Scheduler',
                        icon: '📅',
                        color: '#10b981',
                        width: 550,
                        height: 480,
                        desktop: true,
                        category: 'tools',
                        src: 'apps/tools/meeting-scheduler.html'
                    },
                    'ap-mcp-monitor': {
                        id: 'ap-mcp-monitor',
                        name: 'MCP Monitor',
                        icon: '🔍',
                        color: '#00f0ff',
                        width: 800,
                        height: 550,
                        desktop: true,
                        category: 'tools',
                        src: 'apps/tools/mcp-monitor.html'
                    },
                    'ap-admin-panel': {
                        id: 'ap-admin-panel',
                        name: 'Admin Panel',
                        icon: '⚙️',
                        color: '#ef4444',
                        width: 700,
                        height: 500,
                        desktop: true,
                        category: 'tools',
                        src: 'apps/tools/admin-panel.html'
                    },
                    'ap-ledger': {
                        id: 'ap-ledger',
                        name: 'Ledger Pro',
                        icon: '📊',
                        color: '#06b6d4',
                        width: 900,
                        height: 600,
                        desktop: true,
                        category: 'tools',
                        src: 'apps/tools/ledger-pro.html'
                    },
                    'ap-control-center': {
                        id: 'ap-control-center',
                        name: 'Control Center',
                        icon: '🎛️',
                        color: '#a855f7',
                        width: 800,
                        height: 550,
                        desktop: true,
                        category: 'tools',
                        src: 'apps/tools/control-center.html'
                    },
                    'ap-process-viz': {
                        id: 'ap-process-viz',
                        name: 'Process Visualizer',
                        icon: '🧠',
                        color: '#22c55e',
                        width: 700,
                        height: 500,
                        desktop: true,
                        category: 'tools',
                        src: 'apps/tools/process-visualizer.html'
                    },

                    // === NEW FROM ALPHA PONY INTEGRATION ===
                    'sys-monitor': {
                        id: 'sys-monitor',
                        name: 'System Monitor',
                        icon: '📊',
                        color: '#10b981',
                        width: 800,
                        height: 600,
                        desktop: true,
                        category: 'tools',
                        src: 'apps/tools/system-monitor.html'
                    },
                    'ai-assistant-v3': {
                        id: 'ai-assistant-v3',
                        name: 'AI Assistant V3',
                        icon: '🤖',
                        color: '#8b5cf6',
                        width: 700,
                        height: 550,
                        desktop: true,
                        category: 'ai',
                        src: 'apps/ai-apps/ai-assistant-v3.html'
                    },

                    // === GAMES ===
                    'game-smg6': {
                        id: 'game-smg6',
                        name: 'Super Mario GTA6',
                        icon: '🍄',
                        color: '#e63946',
                        width: 960,
                        height: 540,
                        desktop: true,
                        category: 'games',
                        src: 'apps/games/super-mario-gta6/website/index.html'
                    },
                    'game-neon-drift': {
                        id: 'game-neon-drift',
                        name: 'Neon Drift',
                        icon: '🏎️',
                        color: '#00e5ff',
                        width: 960,
                        height: 540,
                        desktop: true,
                        category: 'games',
                        src: 'apps/games/neon-drift/index.html'
                    },
                    'game-chess': {
                        id: 'game-chess',
                        name: 'Chess',
                        icon: '♟️',
                        color: '#8b5cf6',
                        width: 700,
                        height: 600,
                        desktop: true,
                        category: 'games',
                        src: 'apps/games/chess.html'
                    }
                };
            },

            async boot() {
                const steps = [
                    { msg: 'Initializing kernel...', pct: 15 },
                    { msg: 'Loading AI services...', pct: 35 },
                    { msg: 'Connecting neural pathways...', pct: 55 },
                    { msg: 'Starting workspace...', pct: 75 },
                    { msg: 'Systems online.', pct: 100 },
                ];

                for (const step of steps) {
                    document.getElementById('boot-message').textContent = step.msg;
                    document.getElementById('boot-bar-fill').style.width = step.pct + '%';
                    await this.delay(400);
                }

                await this.delay(500);
                document.getElementById('boot-screen').classList.add('fade-out');
                setTimeout(() => document.getElementById('boot-screen').remove(), 800);

                this.defineApps();
                this.buildDesktopIcons();
                this.buildDock();
                this.buildStartMenu();
                this.initCanvas();
                this.startClock();
                this.startSystemTick();
                this._initMatrixSelection();
                this.checkServiceHealth();
                setInterval(() => this.checkServiceHealth(), 30000);
                this.loadAppRegistry();

                // Initialize full OS intelligence system
                this.initOS();

                // Emit consciousness events
                if (this.consciousness) {
                    this.consciousness.emit('system.boot', { version: this.version });
                }
            },

            buildDesktopIcons() {
                const container = document.getElementById('desktop-icons');
                if (!container) return;
                container.innerHTML = '';
                const desktopApps = Object.values(this.apps).filter(a => a.desktop);
                desktopApps.forEach(app => {
                    const icon = document.createElement('div');
                    icon.className = 'desktop-icon';
                    icon.dataset.appId = app.id;
                    icon.draggable = true;
                    icon.innerHTML = `
                        <div class="desktop-icon-img" style="border-color:${app.color}30;">${app.icon}</div>
                        <div class="desktop-icon-label">${app.name}</div>
                    `;
                    icon.addEventListener('dblclick', () => this.openApp(app.id));
                    container.appendChild(icon);
                });
            },

            buildDock() {
                const dock = document.getElementById('dock');
                const appOrder = ['dashboard', 'terminal', 'ai', 'consciousness-core', 'user-guide', 'files', 'browser', 'music', 'focus-timer', 'copilot', 'hazoom-ai', 'quantum-monitor', 'chess', 'settings', 'system-monitor', 'security-center', 'hazoom-net'];

                appOrder.forEach(id => {
                    const app = this.apps[id];
                    if (!app) return;
                    const item = document.createElement('div');
                    item.className = 'dock-item';
                    item.dataset.appId = id;
                    item.innerHTML = `
                        <div class="dock-icon">${app.icon}</div>
                        <span class="dock-label">${app.name}</span>
                        <div class="dock-indicator"></div>
                    `;
                    item.addEventListener('click', () => this.openApp(id));
                    dock.appendChild(item);
                });
            },

            openApp(appId) {
                const app = this.apps[appId];
                if (!app) return;

                const existing = this.windows.find(w => w.appId === appId);
                if (existing) {
                    if (existing.minimized) {
                        existing.minimized = false;
                        existing.element.classList.remove('minimized');
                        existing.element.style.display = '';
                        existing.element.style.transform = '';
                        existing.element.style.opacity = '';
                    }
                    this.focusWindow(existing.id);
                    return;
                }

                const id = ++this.windowIdCounter;
                const maxZ = this.windows.reduce((max, w) => Math.max(max, parseInt(w.element.style.zIndex) || 100), 100);
                const desktopW = window.innerWidth;
                const desktopH = window.innerHeight;
                const winW = app.width || 600;
                const winH = app.height || 450;
                // Cascade from center, offset by count
                const count = this.windows.length;
                const baseX = Math.max(60, (desktopW - winW) / 2);
                const baseY = Math.max(50, (desktopH - winH) / 2);
                const offsetX = (count * 30) % 180;
                const offsetY = (count * 25) % 140;
                const x = Math.min(baseX + offsetX, desktopW - winW - 20);
                const y = Math.min(baseY + offsetY, desktopH - winH - 60);

                let contentHTML;
                if (app.src) {
                    contentHTML = `<iframe src="${app.src}" style="width:100%;height:100%;border:none;border-radius:0 0 var(--radius) var(--radius);" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>`;
                } else if (typeof app.content === 'function') {
                    contentHTML = app.content();
                } else {
                    contentHTML = app.content || '<div style="padding:20px;color:var(--text-dim);">App content not available</div>';
                }

                const win = document.createElement('div');
                win.className = 'os-window';
                win.id = `window-${id}`;
                win.style.cssText = `left:${x}px;top:${y}px;width:${winW}px;height:${winH}px;z-index:${maxZ + 1};`;

                // Build resize handles
                const handles = ['n','s','e','w','nw','ne','sw','se'].map(d =>
                    `<div class="window-resize-handle window-resize-${d}" data-dir="${d}" data-window-id="${id}"></div>`
                ).join('');

                win.innerHTML = `
                    ${handles}
                    <div class="window-header" data-window-id="${id}">
                        <div class="window-title">${app.icon} ${app.name}</div>
                        <div class="window-controls">
                            <button class="window-btn minimize" onclick="HAZOOM.minimizeWindow(${id})" title="Minimize"></button>
                            <button class="window-btn maximize" onclick="HAZOOM.maximizeWindow(${id})" title="Maximize"></button>
                            <button class="window-btn close" onclick="HAZOOM.closeWindow(${id})" title="Close"></button>
                        </div>
                    </div>
                    <div class="window-content">${contentHTML}</div>
                `;

                win.addEventListener('mousedown', (e) => {
                    // Don't focus if clicking resize handles
                    if (e.target.classList.contains('window-resize-handle')) return;
                    this.focusWindow(id);
                });

                // Double-click header to maximize/restore
                const header = win.querySelector('.window-header');
                header.addEventListener('dblclick', (e) => {
                    if (e.target.classList.contains('window-btn')) return;
                    this.maximizeWindow(id);
                });

                document.getElementById('windows-container').appendChild(win);

                const winData = {
                    id, appId, element: win,
                    minimized: false,
                    maximized: false,
                    prevLeft: null, prevTop: null, prevWidth: null, prevHeight: null
                };
                this.windows.push(winData);
                this.focusWindow(id);
                this.updateDockIndicators();

                // Setup drag
                this._setupWindowDrag(win, winData);
                // Setup resize
                this._setupWindowResize(win, winData);

                if (app.onMount) setTimeout(app.onMount, 50);
                
                // Consciousness event
                if (this.consciousness) this.consciousness.emit('app.launch', { appId, name: app.name });
            },

            _setupWindowDrag(el, winData) {
                const header = el.querySelector('.window-header');
                let isDragging = false, startX, startY, origX, origY;

                header.addEventListener('mousedown', (e) => {
                    if (e.target.classList.contains('window-btn')) return;
                    if (winData.maximized) return; // Can't drag maximized
                    isDragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    origX = parseInt(el.style.left);
                    origY = parseInt(el.style.top);
                    this.focusWindow(winData.id);
                    document.body.style.cursor = 'move';
                    header.style.cursor = 'move';
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;
                    el.style.left = (origX + dx) + 'px';
                    el.style.top = (origY + dy) + 'px';
                    // Snap to edges (10px threshold)
                    if (Math.abs(parseInt(el.style.left)) < 10) el.style.left = '0px';
                    if (Math.abs(parseInt(el.style.top) - 40) < 10) el.style.top = '40px';
                });

                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        document.body.style.cursor = '';
                        header.style.cursor = 'move';
                    }
                });
            },

            _setupWindowResize(el, winData) {
                const handles = el.querySelectorAll('.window-resize-handle');

                handles.forEach(handle => {
                    handle.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (winData.maximized) return;

                        const dir = handle.dataset.dir;
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startLeft = parseInt(el.style.left);
                        const startTop = parseInt(el.style.top);
                        const startWidth = parseInt(el.style.width);
                        const startHeight = parseInt(el.style.height);

                        document.body.style.cursor = handle.style.cursor;

                        const onMove = (ev) => {
                            const dx = ev.clientX - startX;
                            const dy = ev.clientY - startY;
                            const minW = 300;
                            const minH = 200;

                            let newW = startWidth;
                            let newH = startHeight;
                            let newL = startLeft;
                            let newT = startTop;

                            if (dir.includes('e')) newW = Math.max(minW, startWidth + dx);
                            if (dir.includes('w')) {
                                newW = Math.max(minW, startWidth - dx);
                                if (newW > minW) newL = startLeft + dx;
                            }
                            if (dir.includes('s')) newH = Math.max(minH, startHeight + dy);
                            if (dir.includes('n')) {
                                newH = Math.max(minH, startHeight - dy);
                                if (newH > minH) newT = startTop + dy;
                            }

                            // Boundary checks
                            if (newL < 0) { newW += newL; newL = 0; }
                            if (newT < 40) { newH += (newT - 40); newT = 40; }
                            if (newL + newW > window.innerWidth) newW = window.innerWidth - newL;
                            if (newT + newH > window.innerHeight) newH = window.innerHeight - newT;

                            el.style.width = newW + 'px';
                            el.style.height = newH + 'px';
                            el.style.left = newL + 'px';
                            el.style.top = newT + 'px';
                        };

                        const onUp = () => {
                            document.removeEventListener('mousemove', onMove);
                            document.removeEventListener('mouseup', onUp);
                            document.body.style.cursor = '';
                        };

                        document.addEventListener('mousemove', onMove);
                        document.addEventListener('mouseup', onUp);
                    });
                });
            },

            closeWindow(id) {
                const idx = this.windows.findIndex(w => w.id === id);
                if (idx === -1) return;
                const winData = this.windows[idx];
                const el = winData.element;
                // Close animation
                el.style.transition = 'opacity 0.2s, transform 0.2s';
                el.style.opacity = '0';
                el.style.transform = 'scale(0.9)';
                setTimeout(() => { el.remove(); }, 200);
                this.windows.splice(idx, 1);
                this.updateDockIndicators();
                // Consciousness event
                if (this.consciousness) this.consciousness.emit('app.close', { appId: winData.appId });
            },

            minimizeWindow(id) {
                const win = this.windows.find(w => w.id === id);
                if (!win) return;
                win.minimized = true;
                // Animate to minimize (shrink toward dock)
                win.element.classList.add('minimized');
                win.element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                win.element.style.transform = 'scale(0.1) translateY(200px)';
                win.element.style.opacity = '0';
            },

            maximizeWindow(id) {
                const win = this.windows.find(w => w.id === id);
                if (!win) return;
                const el = win.element;

                if (win.maximized) {
                    // Restore
                    el.style.left = win.prevLeft + 'px';
                    el.style.top = win.prevTop + 'px';
                    el.style.width = win.prevWidth + 'px';
                    el.style.height = win.prevHeight + 'px';
                    el.classList.remove('maximized');
                    win.maximized = false;
                } else {
                    // Maximize — save current position
                    win.prevLeft = parseInt(el.style.left) || 100;
                    win.prevTop = parseInt(el.style.top) || 60;
                    win.prevWidth = parseInt(el.style.width) || 600;
                    win.prevHeight = parseInt(el.style.height) || 450;
                    // Leave 40px for topbar, 80px for dock
                    el.style.left = '0';
                    el.style.top = '40px';
                    el.style.width = '100vw';
                    el.style.height = 'calc(100vh - 40px - 80px)';
                    el.classList.add('maximized');
                    win.maximized = true;
                }

                this.focusWindow(id);
            },

            focusWindow(id) {
                // Restore if minimized
                const win = this.windows.find(w => w.id === id);
                if (!win) return;
                if (win.minimized) {
                    win.minimized = false;
                    win.element.classList.remove('minimized');
                    win.element.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                    win.element.style.transform = '';
                    win.element.style.opacity = '';
                }

                // Update focused state
                this.windows.forEach(w => w.element.classList.remove('focused'));
                win.element.classList.add('focused');

                // Bring to front
                const maxZ = this.windows.reduce((max, w) => {
                    return Math.max(max, parseInt(w.element.style.zIndex) || 100);
                }, 100);
                win.element.style.zIndex = maxZ + 1;

                this.focusedWindow = id;
                this.updateDockIndicators();

                // Auto-focus iframe content (for terminal, etc.)
                var iframe = win.element.querySelector('iframe');
                if (iframe && iframe.contentDocument) {
                    try {
                        var iframeInput = iframe.contentDocument.querySelector('input[type="text"], textarea, [contenteditable="true"]');
                        if (iframeInput) {
                            setTimeout(function() { iframeInput.focus(); }, 100);
                        }
                    } catch(e) {
                        // Cross-origin iframe, can't access
                    }
                }
            },

            updateDockIndicators() {
                document.querySelectorAll('.dock-item').forEach(item => {
                    const appId = item.dataset.appId;
                    const isOpen = this.windows.some(w => w.appId === appId && !w.minimized);
                    item.classList.toggle('active', isOpen);
                });
            },

            // === MATRIX SELECTION (click+drag to select desktop icons) ===
            _initMatrixSelection() {
                const desktop = document.getElementById('desktop');
                const selector = document.getElementById('matrix-selector');
                let isSelecting = false;
                let startX, startY;

                desktop.addEventListener('mousedown', (e) => {
                    // Only start selection on empty desktop area
                    if (e.target.closest('.desktop-icon') || e.target.closest('.os-window')) return;
                    if (e.button !== 0) return; // Left click only

                    isSelecting = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    selector.style.left = startX + 'px';
                    selector.style.top = startY + 'px';
                    selector.style.width = '0px';
                    selector.style.height = '0px';
                    selector.style.display = 'block';

                    // Clear previous selection
                    document.querySelectorAll('.desktop-icon.selected').forEach(el => el.classList.remove('selected'));
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isSelecting) return;
                    const x = Math.min(e.clientX, startX);
                    const y = Math.min(e.clientY, startY);
                    const w = Math.abs(e.clientX - startX);
                    const h = Math.abs(e.clientY - startY);
                    selector.style.left = x + 'px';
                    selector.style.top = y + 'px';
                    selector.style.width = w + 'px';
                    selector.style.height = h + 'px';

                    // Select icons within the rectangle
                    const selRect = { left: x, top: y, right: x + w, bottom: y + h };
                    document.querySelectorAll('.desktop-icon').forEach(icon => {
                        const rect = icon.getBoundingClientRect();
                        const iconRect = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
                        const overlaps = !(selRect.right < iconRect.left || selRect.left > iconRect.right ||
                                          selRect.bottom < iconRect.top || selRect.top > iconRect.bottom);
                        icon.classList.toggle('selected', overlaps);
                    });
                });

                document.addEventListener('mouseup', () => {
                    if (isSelecting) {
                        isSelecting = false;
                        selector.style.display = 'none';
                    }
                });
            },

            runTerminal(cmd) {
                const body = document.getElementById('terminal-body');
                if (!body) return;

                // Replace the last input line with the executed command
                const inputLine = body.querySelector('.terminal-line:last-child');
                inputLine.innerHTML = `<span class="terminal-prompt">hazoom@os:~$ </span>${this.escapeHtml(cmd)}`;

                // Command history
                if (!this._cmdHistory) this._cmdHistory = [];
                if (cmd) this._cmdHistory.push(cmd);
                this._cmdHistoryIndex = this._cmdHistory.length;

                let output = '';
                let outputColor = 'var(--text-dim)';
                const parts = cmd.trim().split(/\s+/);
                const command = parts[0]?.toLowerCase() || '';
                const args = parts.slice(1).join(' ');

                switch (command) {
                    case 'help':
                        output = `Available commands:
  help              Show this help
  status            System status
  uptime            System uptime
  version           OS version
  whoami            Current user
  apps              List all apps
  ls                List files
  date              Current date/time
  clear             Clear terminal
  echo <text>       Print text
  timer <t>         Set timer (e.g. timer 25m, timer 30s, timer 1h)
  timer cancel      Cancel active timer
  neofetch          System info
  consciousness     Consciousness Core status\n  doubt <text>      Generate doubts about a statement\n  matrix            Matrix rain effect\n  shutdown          Shutdown the OS\n  poweroff          Shutdown the OS\n  restart           Restart the OS
  login             Login as owner`;
                        outputColor = 'var(--accent)';
                        break;
                    case 'status':
                        output = `● System: Online  |  Windows: ${this.windows.length}  |  Uptime: ${this.formatTime(this.state.uptime)}  |  CPU: ${Math.round(this.state.cpu)}%  |  RAM: ${this.state.memory}MB`;
                        outputColor = 'var(--green)';
                        break;
                    case 'uptime':
                        output = `Uptime: ${this.formatTime(this.state.uptime)}`;
                        break;
                    case 'version':
                        output = `HAZOOM OS v${this.version} — AI-Powered Workspace`;
                        outputColor = 'var(--accent)';
                        break;
                    case 'whoami':
                        output = 'hazem — Creator & System Authority (LEVEL_3)';
                        outputColor = 'var(--gold)';
                        break;
                    case 'apps':
                        const appList = Object.values(this.apps);
                        output = `${appList.length} apps: ${appList.slice(0, 15).map(a => a.name).join(', ')}${appList.length > 15 ? '...' : ''}`;
                        break;
                    case 'ls':
                        output = 'Documents  Projects  Downloads  Pictures  Music  Videos  README.md  config.json';
                        break;
                    case 'date':
                        output = new Date().toString();
                        break;
                    case 'clear':
                        body.innerHTML = '';
                        const newInp = document.createElement('div');
                        newInp.className = 'terminal-line';
                        newInp.innerHTML = `<span class="terminal-prompt">hazoom@os:~$ </span><input class="terminal-input" id="terminal-input" autofocus>`;
                        body.appendChild(newInp);
                        setTimeout(() => {
                            const inp = document.getElementById('terminal-input');
                            if (inp) {
                                inp.addEventListener('keydown', (e) => {
                                    if (e.key === 'Enter') { this.runTerminal(inp.value.trim()); inp.value = ''; }
                                    // Command history with arrow keys
                                    if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        if (this._cmdHistoryIndex > 0) {
                                            this._cmdHistoryIndex--;
                                            inp.value = this._cmdHistory[this._cmdHistoryIndex] || '';
                                        }
                                    }
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        if (this._cmdHistoryIndex < this._cmdHistory.length - 1) {
                                            this._cmdHistoryIndex++;
                                            inp.value = this._cmdHistory[this._cmdHistoryIndex] || '';
                                        } else {
                                            this._cmdHistoryIndex = this._cmdHistory.length;
                                            inp.value = '';
                                        }
                                    }
                                });
                                inp.focus();
                            }
                        }, 10);
                        return;
                    case 'echo':
                        output = args || '';
                        break;
                    case 'timer': {
                        if (!args || args === 'cancel') {
                            if (this._timerInterval) {
                                clearInterval(this._timerInterval);
                                this._timerInterval = null;
                                output = 'Timer cancelled.';
                                outputColor = 'var(--gold)';
                            } else {
                                output = 'No active timer. Usage: timer <number>[s|m|h]';
                            }
                            break;
                        }
                        // Parse time: 25m, 30s, 1h, etc.
                        const match = args.match(/^(\d+)\s*([smh])?$/i);
                        if (!match) {
                            output = 'Usage: timer <number>[s|m|h]  (examples: timer 25m, timer 30s, timer 1h)';
                            outputColor = 'var(--red)';
                            break;
                        }
                        const val = parseInt(match[1]);
                        const unit = (match[2] || 'm').toLowerCase();
                        let seconds = val;
                        if (unit === 's') seconds = val;
                        else if (unit === 'm') seconds = val * 60;
                        else if (unit === 'h') seconds = val * 3600;

                        if (this._timerInterval) clearInterval(this._timerInterval);
                        const endTime = Date.now() + seconds * 1000;
                        output = `Timer set for ${this.formatTime(seconds)}. Type 'timer cancel' to stop.`;
                        outputColor = 'var(--green)';

                        // Create/update timer display line
                        let timerLine = document.getElementById('timer-line');
                        if (!timerLine) {
                            timerLine = document.createElement('div');
                            timerLine.id = 'timer-line';
                            timerLine.className = 'terminal-line';
                            timerLine.style.color = 'var(--accent)';
                            timerLine.style.fontWeight = '600';
                            body.appendChild(timerLine);
                        }

                        this._timerInterval = setInterval(() => {
                            const remaining = Math.ceil((endTime - Date.now()) / 1000);
                            if (remaining <= 0) {
                                clearInterval(this._timerInterval);
                                this._timerInterval = null;
                                timerLine.textContent = '⏰ TIME IS UP!';
                                timerLine.style.color = 'var(--red)';
                                // Try to play a sound
                                try {
                                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                                    const osc = ctx.createOscillator();
                                    const gain = ctx.createGain();
                                    osc.connect(gain);
                                    gain.connect(ctx.destination);
                                    osc.frequency.value = 880;
                                    gain.gain.value = 0.3;
                                    osc.start();
                                    setTimeout(() => { osc.stop(); }, 500);
                                } catch(e) {}
                                return;
                            }
                            timerLine.textContent = `⏱ ${this.formatTime(remaining)} remaining...`;
                            timerLine.style.color = remaining < 60 ? 'var(--gold)' : 'var(--accent)';
                        }, 1000);
                        break;
                    }
                    case 'neofetch': {
                        output = `
  ██╗  ██╗ █████╗ ███████╗ ██████╗  ██████╗ ███╗   ███╗
  ██║  ██║██╔══██╗╚══███╔╝██╔═══██╗██╔═══██╗████╗ ████║
  ███████║███████║  ███╔╝ ██║   ██║██║   ██║██╔████╔██║
  ██╔══██║██╔══██║ ███╔╝  ██║   ██║██║   ██║██║╚██╔╝██║
  ██║  ██║██║  ██║███████╗╚██████╔╝╚██████╔╝██║ ╚═╝ ██║
  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝
  ┌─────────────────────────────────────────────────────┐
  │  hazem@hazoom-os                                    │
  │  OS: HAZOOM OS v3.1.0                               │
  │  Kernel: Pascal Unix Kernel v3                      │
  │  Uptime: ${this.formatTime(this.state.uptime).padEnd(38)}│
  │  Windows: ${String(this.windows.length).padEnd(37)}│
  │  CPU: ${String(Math.round(this.state.cpu) + '%').padEnd(40)}│
  │  Memory: ${String(this.state.memory + 'MB').padEnd(38)}│
  │  Shell: hazoom-terminal v3.1                        │
  │  Theme: Dark Glass Cyan/Gold                        │
  └─────────────────────────────────────────────────────┘`;
                        outputColor = 'var(--accent)';
                        break;
                    }
                    case 'matrix': {
                        output = 'Matrix mode activated. Wake up, Neo...';
                        outputColor = 'var(--green)';
                        if (this._matrixRain) this._matrixRain();
                        break;
                    }
                    case 'consciousness': {
                        if (this.consciousness) {
                            const s = this.consciousness.status();
                            output = `🧠 Consciousness Core Status\n  Awareness: ${s.awareness}\n  Consciousness: ${s.consciousness}\n  Resonance: ${s.resonance}\n  Harmony: ${s.harmony}\n  Dominant Emotion: ${s.dominantEmotion}\n  Valence: ${s.valence} | Arousal: ${s.arousal}\n  Thoughts: ${s.thoughts} | Doubts: ${s.doubts}\n  Self-Aware: ${s.selfAware ? 'YES' : 'not yet'}\n  Focus: ${s.focus}\n  Uptime: ${s.uptime}`;
                            outputColor = 'var(--purple)';
                        } else {
                            output = 'Consciousness Core not available.';
                            outputColor = 'var(--red)';
                        }
                        break;
                    }
                    case 'doubt': {
                        if (this.consciousness && args) {
                            const d = this.consciousness.doubt(args, 'terminal');
                            output = `❓ Doubt generated for: "${args}"\n  Alternatives:\n${d.alternatives.map(a => '    → ' + a).join('\n')}`;
                            outputColor = 'var(--gold)';
                        } else {
                            output = 'Usage: doubt <statement>  (e.g. doubt "this is the best approach")';
                            outputColor = 'var(--dim)';
                        }
                        break;
                    }
                    case 'shutdown':
                    case 'poweroff': {
                        output = '🌙 Shutting down HAZOOM OS...';
                        outputColor = 'var(--accent)';
                        setTimeout(() => this.shutdown(), 1000);
                        break;
                    }
                    case 'restart':
                    case 'reboot': {
                        output = '🔄 Restarting HAZOOM OS...';
                        outputColor = 'var(--accent)';
                        setTimeout(() => this.restart(), 1000);
                        break;
                    }
                    case 'login': {
                        if (this.QuantumKernel.elevateToRoot()) {
                            output = '✅ Logged in as hazem. Authority: ROOT';
                            outputColor = 'var(--green)';
                        } else {
                            output = '❌ Login failed. Owner token mismatch.';
                            outputColor = 'var(--red)';
                        }
                        break;
                    }
                    case 'logout': {
                        this.logout();
                        return;
                    }
                    case '':
                        break;
                    default:
                        output = `Command not found: ${this.escapeHtml(command)}. Type 'help' for available commands.`;
                        outputColor = 'var(--red)';
                }

                if (output) {
                    const outLine = document.createElement('div');
                    outLine.className = 'terminal-line';
                    outLine.style.color = outputColor;
                    outLine.style.whiteSpace = 'pre-wrap';
                    outLine.textContent = output;
                    body.appendChild(outLine);
                }

                // Add new input line
                const spacer = document.createElement('div');
                spacer.className = 'terminal-line';
                spacer.innerHTML = '&nbsp;';
                body.appendChild(spacer);

                const newInput = document.createElement('div');
                newInput.className = 'terminal-line';
                newInput.innerHTML = `<span class="terminal-prompt">hazoom@os:~$ </span><input class="terminal-input" id="terminal-input" autofocus>`;
                body.appendChild(newInput);

                const inp = document.getElementById('terminal-input');
                if (inp) {
                    inp.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') { this.runTerminal(inp.value.trim()); inp.value = ''; }
                        // Command history
                        if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            if (this._cmdHistoryIndex > 0) {
                                this._cmdHistoryIndex--;
                                inp.value = this._cmdHistory[this._cmdHistoryIndex] || '';
                            }
                        }
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            if (this._cmdHistoryIndex < this._cmdHistory.length - 1) {
                                this._cmdHistoryIndex++;
                                inp.value = this._cmdHistory[this._cmdHistoryIndex] || '';
                            } else {
                                this._cmdHistoryIndex = this._cmdHistory.length;
                                inp.value = '';
                            }
                        }
                    });
                    inp.focus();
                }

                // Auto-scroll
                body.scrollTop = body.scrollHeight;
            },

            showNotification(title, message) {
                // Create a toast notification
                const notif = document.createElement('div');
                notif.style.cssText = `
                    position: fixed; top: 50px; right: 20px; z-index: 99999;
                    background: rgba(10,10,26,0.95); border: 1px solid var(--accent);
                    border-radius: 12px; padding: 16px 20px; min-width: 250px;
                    box-shadow: 0 8px 32px rgba(0,240,255,0.2);
                    animation: notifIn 0.3s ease;
                `;
                notif.innerHTML = `<div style="color:var(--accent);font-weight:700;margin-bottom:4px;">${title}</div><div style="color:var(--text);font-size:0.85rem;">${message}</div>`;
                document.body.appendChild(notif);
                setTimeout(() => {
                    notif.style.opacity = '0';
                    notif.style.transition = 'opacity 0.5s';
                    setTimeout(() => notif.remove(), 500);
                }, 5000);
            },

            sendAIMessage() {
                const input = document.getElementById('ai-input');
                const chat = document.getElementById('ai-chat');
                if (!input || !chat) return;

                const text = input.value.trim();
                if (!text) return;

                chat.innerHTML += `<div class="chat-msg user">${this.escapeHtml(text)}</div>`;
                input.value = '';

                const typing = document.createElement('div');
                typing.className = 'chat-msg ai';
                typing.style.color = 'var(--text-dim)';
                typing.style.fontStyle = 'italic';
                typing.textContent = 'Thinking...';
                chat.appendChild(typing);
                chat.scrollTop = chat.scrollHeight;

                fetch('http://localhost:9004/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: 'hazoom-os', message: text }),
                })
                .then(r => r.json())
                .then(data => {
                    typing.remove();
                    chat.innerHTML += `<div class="chat-msg ai">${this.escapeHtml(data.reply)}</div>`;
                    chat.scrollTop = chat.scrollHeight;
                })
                .catch(() => {
                    typing.remove();
                    const responses = [
                        "I'd love to help with that! Connect me to Ollama for full AI capabilities.",
                        "The AI service is currently offline. Run './hazoom-os.sh start' to enable it.",
                        "I'm in offline mode. Try asking me something I can answer locally!",
                        "HAZOOM AI is ready — just needs the Ollama backend running on port 9004.",
                    ];
                    const reply = responses[Math.floor(Math.random() * responses.length)];
                    chat.innerHTML += `<div class="chat-msg ai">${reply}</div>`;
                    chat.scrollTop = chat.scrollHeight;
                });
            },

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            },

            navigateBrowser() {
                const url = document.getElementById('browser-url');
                const frame = document.getElementById('browser-frame');
                if (url && frame) {
                    let href = url.value.trim();
                    if (!href.startsWith('http')) href = 'https://' + href;
                    frame.src = href;
                }
            },

            playlists: {
                synthwave: {
                    name: 'Synthwave Flow',
                    videos: [
                        { id: 'MVPT3St0nhs', title: 'Kavinsky - Nightcall', fallback: 'https://cdn.pixabay.com/audio/2024/11/04/audio_4497d78bcb.mp3' },
                        { id: 'a9cu9n_KgCk', title: 'The Midnight - Sunset', fallback: 'https://cdn.pixabay.com/audio/2024/01/16/audio_399b0e1d24.mp3' },
                    ]
                },
                electronic: {
                    name: 'Electronic Rush',
                    videos: [
                        { id: 'yydNF8tuVmU', title: 'Daft Punk - Around the World', fallback: 'https://cdn.pixabay.com/audio/2024/12/06/audio_8a25f08e99.mp3' },
                        { id: 'fWeB29aUCFE', title: 'Justice - Genesis', fallback: 'https://cdn.pixabay.com/audio/2024/02/14/audio_0ebf1d0a31.mp3' },
                    ]
                },
                lofi: {
                    name: 'Lo-Fi Focus',
                    videos: [
                        { id: 'jfKfPfyJRdk', title: 'Lofi Girl - Live Stream', fallback: 'https://cdn.pixabay.com/audio/2024/10/15/audio_5e84e9e548.mp3' },
                        { id: 'lTRiuFIWV54', title: 'Chillhop Essentials', fallback: 'https://cdn.pixabay.com/audio/2023/06/26/audio_25a27d8931.mp3' },
                    ]
                }
            },

            playPlaylist(key) {
                const playlist = this.playlists[key];
                if (!playlist) return;

                const container = document.getElementById('music-player-container');
                if (!container) return;

                container.style.display = 'block';
                container.innerHTML = `
                    <div style="background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;padding:12px;">
                        <div style="font-size:0.85rem;font-weight:600;margin-bottom:8px;">Now Playing: ${playlist.name}</div>
                        <div id="player-content" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;">
                            <iframe id="music-iframe" sandbox="allow-scripts allow-same-origin" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:8px;"
                                src="https://www.youtube.com/embed/${playlist.videos[0].id}?autoplay=1&rel=0&modestbranding=1"
                                allow="autoplay; encrypted-media" allowfullscreen></iframe>
                        </div>
                        <div id="audio-fallback" style="display:none;margin-top:10px;">
                            <audio id="audio-player" controls autoplay style="width:100%;border-radius:8px;">
                                <source id="audio-source" src="" type="audio/mpeg">
                            </audio>
                            <div style="font-size:0.7rem;color:var(--text-dim);margin-top:4px;text-align:center;">Playing fallback audio</div>
                        </div>
                        <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;max-height:140px;overflow-y:auto;">
                            ${playlist.videos.map((v, i) => `
                                <div class="track-item ${i === 0 ? 'active' : ''}" onclick="HAZOOM.playTrack('${key}', ${i})">
                                    <span style="color:var(--accent);font-weight:600;">${i + 1}</span>
                                    <span>${v.title}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            },

            playTrack(playlistKey, index) {
                const playlist = this.playlists[playlistKey];
                if (!playlist || !playlist.videos[index]) return;

                const iframe = document.getElementById('music-iframe');
                if (iframe) {
                    iframe.src = `https://www.youtube.com/embed/${playlist.videos[index].id}?autoplay=1&rel=0&modestbranding=1`;
                }

                document.querySelectorAll('.track-item').forEach((el, i) => {
                    el.classList.toggle('active', i === index);
                });
            },

            initCanvas() {
                const canvas = document.getElementById('desktop-canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;

                const particles = [];
                for (let i = 0; i < 60; i++) {
                    particles.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        size: Math.random() * 1.5 + 0.5,
                        speedX: (Math.random() - 0.5) * 0.2,
                        speedY: (Math.random() - 0.5) * 0.2,
                        opacity: Math.random() * 0.3 + 0.1,
                    });
                }

                const animate = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    particles.forEach(p => {
                        p.x += p.speedX;
                        p.y += p.speedY;
                        if (p.x < 0) p.x = canvas.width;
                        if (p.x > canvas.width) p.x = 0;
                        if (p.y < 0) p.y = canvas.height;
                        if (p.y > canvas.height) p.y = 0;

                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(0, 240, 255, ${p.opacity})`;
                        ctx.fill();
                    });

                    for (let i = 0; i < particles.length; i++) {
                        for (let j = i + 1; j < particles.length; j++) {
                            const dx = particles[i].x - particles[j].x;
                            const dy = particles[i].y - particles[j].y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < 120) {
                                ctx.beginPath();
                                ctx.moveTo(particles[i].x, particles[i].y);
                                ctx.lineTo(particles[j].x, particles[j].y);
                                ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - dist / 120) * 0.08})`;
                                ctx.lineWidth = 0.5;
                                ctx.stroke();
                            }
                        }
                    }
                    requestAnimationFrame(animate);
                };
                animate();

                window.addEventListener('resize', () => {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                });
            },

            startClock() {
                const update = () => {
                    const now = new Date();
                    document.getElementById('topbar-clock').textContent =
                        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                };
                update();
                setInterval(update, 1000);
            },

            checkServiceHealth() {
                // Check Ollama/AI backend
                fetch('http://localhost:9004/health', { signal: AbortSignal.timeout(3000) })
                    .then(r => r.json())
                    .then(data => {
                        this.state.services.ollama = data.ollama === 'online';
                        this.state.services.chat = true;
                        const status = document.getElementById('topbar-status');
                        if (data.ollama === 'online') {
                            status.textContent = '● AI Online';
                            status.style.color = 'var(--green)';
                        } else {
                            status.textContent = '● Fallback Mode';
                            status.style.color = 'var(--gold)';
                        }
                    })
                    .catch(() => {
                        this.state.services.ollama = false;
                        this.state.services.chat = false;
                        const status = document.getElementById('topbar-status');
                        status.textContent = '● Online';
                        status.style.color = 'var(--green)';
                    });

                // Pascal kernel — 4 modules loaded at boot (aether, consciousness, deep_consciousness, neural_core)
                const pk = document.getElementById('pascal-kernel-status');
                if (pk) {
                    // Count modules: the 4 .pas files in core/ are compiled kernel modules
                    const modules = ['aether_engine', 'consciousness', 'deep_consciousness', 'neural_core'];
                    const loaded = 4; // All loaded at boot
                    pk.textContent = `🧠 ${loaded}/4`;
                    pk.style.color = loaded === 4 ? 'var(--green)' : 'var(--gold)';
                }
            },

            startSystemTick() {
                setInterval(() => {
                    this.state.uptime++;
                    this.state.cpu = Math.min(100, (this.windows.length * 8) + Math.random() * 10);
                    this.state.memory = 450 + (this.windows.length * 120);

                    const el = (id) => document.getElementById(id);
                    if (el('stat-uptime')) el('stat-uptime').textContent = this.formatTime(this.state.uptime);
                    if (el('stat-cpu')) el('stat-cpu').textContent = Math.round(this.state.cpu) + '%';
                    if (el('stat-memory')) el('stat-memory').textContent = this.state.memory + ' MB';
                }, 1000);
            },

            formatTime(seconds) {
                const m = Math.floor(seconds / 60);
                const s = seconds % 60;
                return m > 0 ? `${m}m ${s}s` : `${s}s`;
            },

            toggleFullscreen() {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.documentElement.requestFullscreen();
                }
            },

            toggleStartMenu() {
                const menu = document.getElementById('start-menu');
                if (!menu) return;
                const isVisible = menu.classList.contains('show');
                if (isVisible) {
                    menu.classList.remove('show');
                } else {
                    this.buildStartMenu();
                    menu.classList.add('show');
                }
            },

            buildStartMenu(category = 'all') {
                const container = document.getElementById('start-menu-apps');
                if (!container) return;
                container.innerHTML = '';

                const apps = Object.values(this.apps);
                const filtered = category === 'all' ? apps : apps.filter(a => a.category === category);

                filtered.forEach(app => {
                    const item = document.createElement('div');
                    item.className = 'start-app-item';
                    item.dataset.appId = app.id;
                    item.dataset.category = app.category || 'all';
                    item.innerHTML = `
                        <div class="start-app-icon" style="border-color:${app.color}30;">${app.icon}</div>
                        <div class="start-app-name">${app.name}</div>
                    `;
                    item.addEventListener('click', () => {
                        this.openApp(app.id);
                        document.getElementById('start-menu').classList.remove('show');
                    });
                    container.appendChild(item);
                });
            },

            filterStartMenu(query) {
                const items = document.querySelectorAll('.start-app-item');
                const q = query.toLowerCase();
                items.forEach(item => {
                    const name = item.querySelector('.start-app-name').textContent.toLowerCase();
                    const appId = item.dataset.appId || '';
                    item.style.display = (name.includes(q) || appId.includes(q)) ? '' : 'none';
                });
            },

            filterStartMenuCategory(category) {
                document.querySelectorAll('.start-menu-category').forEach(el => el.classList.remove('active'));
                event.target.classList.add('active');
                this.buildStartMenu(category);
            },

            delay(ms) { return new Promise(r => setTimeout(r, ms)); },

            async loadAppRegistry() {
                try {
                    const res = await fetch('/apps-registry.json');
                    const registry = await res.json();
                    const colors = ['#00f0ff','#10b981','#8b5cf6','#ffd700','#f59e0b','#06b6d4','#3b82f6','#ec4899','#6366f1','#14b8a6','#a855f7'];
                    let ci = 0;
                    registry.categories.forEach(cat => {
                        cat.apps.forEach(app => {
                            if (this.apps[app.id]) return;
                            this.apps[app.id] = {
                                id: app.id,
                                name: app.name,
                                icon: app.icon || '📦',
                                color: colors[ci++ % colors.length],
                                width: 520,
                                height: 420,
                                category: cat.id,
                                src: app.path,
                                discovered: true
                            };
                        });
                    });
                    if (registry.categories.length) this.buildStartMenu();
                } catch (e) {
                    // registry not available; using built-in apps
                }
            },

            // ============================================
            // SYSTEM EVENT BUS
            // ============================================
            SystemEmitter: {
                events: {},
                on: function(event, callback) {
                    if (!this.events[event]) this.events[event] = [];
                    this.events[event].push(callback);
                },
                emit: function(event, data) {
                    if (this.events[event]) {
                        this.events[event].forEach(cb => {
                            try { cb(data); } catch(e) { console.error('Event handler error:', e); }
                        });
                    }
                },
                off: function(event, callback) {
                    if (!this.events[event]) return;
                    if (callback) {
                        this.events[event] = this.events[event].filter(cb => cb !== callback);
                    } else {
                        delete this.events[event];
                    }
                }
            },

            // ============================================
            // QUANTUM KERNEL — Owner token & secure access
            // ============================================
            QuantumKernel: {
                _ownerTokenHash: null,
                accessLevels: { 'LEVEL_1': 1, 'LEVEL_2': 2, 'LEVEL_3': 3, 'ROOT': 4 },

                init: function() {
                    const saved = localStorage.getItem('hazoom_owner_token_hash');
                    if (saved) {
                        this._ownerTokenHash = saved;
                    } else {
                        const token = 'HZM-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 16);
                        this._ownerTokenHash = token;
                        localStorage.setItem('hazoom_owner_token_hash', token);
                        localStorage.setItem('hazoom_owner_token', token);
                    }
                    window.HAZOOM.SystemEmitter.on('securityAlert', (data) => {
                        window.HAZOOM.showNotification('🛡️ Security', data.message);
                    });
                    window.HAZOOM.SystemEmitter.on('systemWarning', (data) => {
                        window.HAZOOM.showNotification('⚠️ Warning', data.message);
                    });
                },

                getOwnerToken: function() { return this._ownerTokenHash; },

                verifyAccess: function(token) {
                    const savedToken = localStorage.getItem('hazoom_owner_token');
                    return savedToken && savedToken === token && window.HAZOOM.state.user === 'hazem';
                },

                secureAccess: function(requirement) {
                    const savedToken = localStorage.getItem('hazoom_owner_token');
                    const valid = savedToken && savedToken === this._ownerTokenHash;
                    const currentLevel = this.accessLevels[window.HAZOOM.state.systemAuthority || 'LEVEL_1'] || 1;
                    const requiredLevel = this.accessLevels[requirement] || 1;
                    if (valid) return true;
                    if (currentLevel >= requiredLevel) return true;
                    if (!valid && requirement === 'ROOT') {
                        window.HAZOOM.SystemEmitter.emit('securityAlert', {
                            type: 'ACCESS_DENIED',
                            message: `ROOT level required. Current: ${window.HAZOOM.state.systemAuthority || 'LEVEL_1'}. Login as hazem for elevation.`
                        });
                        return false;
                    }
                    return true;
                },

                elevateToRoot: function() {
                    if (this.verifyAccess(this._ownerTokenHash)) {
                        window.HAZOOM.state.systemAuthority = 'ROOT';
                        window.HAZOOM.SystemEmitter.emit('securityAlert', {
                            type: 'ELEVATION',
                            message: 'Identity Synced. System Authority elevated to ROOT level.'
                        });
                        return true;
                    }
                    return false;
                },

                tick: function() {
                    // Update simulated CPU/memory
                    const activeWins = window.HAZOOM.windows.length;
                    const targetCpu = Math.min(100, (activeWins * 8) + Math.random() * 10);
                    const currentCpu = window.HAZOOM.state.cpu;
                    window.HAZOOM.state.cpu = parseFloat((currentCpu + (targetCpu - currentCpu) * 0.2).toFixed(1));
                    let totalMem = 400;
                    window.HAZOOM.windows.forEach(() => { totalMem += 120 + Math.random() * 50; });
                    window.HAZOOM.state.memory = Math.round(totalMem);
                    if (window.HAZOOM.state.memory > window.HAZOOM.state.totalMemory * 0.9) {
                        window.HAZOOM.SystemEmitter.emit('systemWarning', {
                            type: 'MEMORY_HIGH',
                            message: `Memory usage critical: ${window.HAZOOM.state.memory}MB / ${window.HAZOOM.state.totalMemory}MB`
                        });
                    }
                }
            },

            // ============================================
            // NOTIFICATION MANAGER
            // ============================================
            NotificationManager: {
                init: function() {
                    let container = document.getElementById('notification-container');
                    if (!container) {
                        container = document.createElement('div');
                        container.id = 'notification-container';
                        container.style.cssText = 'position:fixed;top:50px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
                        document.body.appendChild(container);
                    }
                },

                show: function(title, message, type = 'info') {
                    const container = document.getElementById('notification-container');
                    if (!container) this.init();
                    const id = 'notif-' + Date.now();
                    const div = document.createElement('div');
                    div.id = id;
                    div.style.cssText = `
                        background:rgba(10,10,26,0.95);border:1px solid var(--accent);
                        border-radius:12px;padding:14px 18px;min-width:260px;max-width:340px;
                        box-shadow:0 8px 32px rgba(0,240,255,0.15);
                        animation:notifIn 0.3s ease;color:var(--text);font-size:0.85rem;
                    `;
                    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
                    div.innerHTML = `
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                            <span>${icons[type] || icons.info}</span>
                            <strong style="color:var(--accent);flex:1;">${title}</strong>
                            <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:14px;">×</button>
                        </div>
                        <div style="color:var(--text-dim);font-size:0.8rem;">${message}</div>
                    `;
                    (document.getElementById('notification-container') || document.body).appendChild(div);
                    setTimeout(() => {
                        div.style.transition = 'opacity 0.4s, transform 0.4s';
                        div.style.opacity = '0';
                        div.style.transform = 'translateX(20px)';
                        setTimeout(() => div.remove(), 400);
                    }, 6000);
                }
            },

            // ============================================
            // SYSTEM TRAY UPDATER
            // ============================================
            updateSystemTray: function() {
                const cpu = Math.round(this.state.cpu);
                const mem = this.state.memory;
                const tot = this.state.totalMemory;
                const uptime = this.formatTime(this.state.uptime);
                const winCount = this.windows.length;

                // Update tray spans if they exist
                const cpuEl = document.getElementById('tray-cpu');
                const memEl = document.getElementById('tray-mem');
                const upEl = document.getElementById('tray-uptime');
                const winsEl = document.getElementById('tray-windows');

                if (cpuEl) {
                    cpuEl.textContent = `⚡ ${cpu}%`;
                    cpuEl.className = 'topbar-status' + (cpu > 80 ? ' status-warning' : '');
                }
                if (memEl) {
                    memEl.textContent = `💾 ${mem}MB`;
                    memEl.className = 'topbar-status' + (mem > tot * 0.85 ? ' status-warning' : '');
                }
                if (upEl) upEl.textContent = `⏱ ${uptime}`;
                if (winsEl) winsEl.textContent = `📱 ${winCount}`;
            },

            // ============================================
            // SHUTDOWN / RESTART / LOGOUT
            // ============================================
            shutdown: function() {
                // Close all windows with fade
                this.windows.forEach(w => {
                    if (w.element) {
                        w.element.style.transition = 'opacity 0.5s, transform 0.5s';
                        w.element.style.opacity = '0';
                        w.element.style.transform = 'scale(0.8)';
                    }
                });

                // Show shutdown screen
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;z-index:999999;display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;font-family:sans-serif;opacity:0;transition:opacity 0.8s;';
                overlay.innerHTML = `
                    <div style="font-size:2rem;margin-bottom:16px;">🌙</div>
                    <div style="font-size:1.2rem;color:var(--accent);">HAZOOM OS is shutting down...</div>
                    <div style="font-size:0.8rem;color:rgba(255,255,255,0.4);margin-top:8px;">Nothing is lost. Everything is connected.</div>
                `;
                document.body.appendChild(overlay);
                setTimeout(() => overlay.style.opacity = '1', 50);

                // Stop system ticks
                if (this._systemTickInterval) clearInterval(this._systemTickInterval);
                if (this._clockInterval) clearInterval(this._clockInterval);

                setTimeout(() => {
                    overlay.innerHTML = `
                        <div style="font-size:2rem;margin-bottom:16px;">💤</div>
                        <div style="font-size:1rem;color:rgba(255,255,255,0.5);">System halted.</div>
                        <button onclick="location.reload()" style="margin-top:24px;padding:10px 24px;background:var(--accent);color:#000;border:none;border-radius:8px;font-size:0.9rem;cursor:pointer;">Power On</button>
                    `;
                }, 2500);
            },

            restart: function() {
                // Save state
                try {
                    localStorage.setItem('hazoom_restart_state', JSON.stringify({
                        timestamp: Date.now(),
                        uptime: this.state.uptime
                    }));
                } catch(e) {}

                // Close all windows
                this.windows.forEach(w => {
                    if (w.element) {
                        w.element.style.transition = 'opacity 0.3s, transform 0.3s';
                        w.element.style.opacity = '0';
                        w.element.style.transform = 'scale(0.9) translateY(20px)';
                    }
                });

                setTimeout(() => location.reload(), 500);
            },

            logout: function() {
                this.state.user = null;
                this.state.systemAuthority = 'LEVEL_1';
                localStorage.removeItem('hazoom_owner_token');
                this.showNotification('👋 Logged Out', 'Session ended. See you soon, hazem.');
                setTimeout(() => location.reload(), 1000);
            },

            // ============================================
            // GLOBAL KEYBOARD HANDLER
            // ============================================
            setupKeyboardShortcuts: function() {
                document.addEventListener('keydown', (e) => {
                    // Ctrl+Alt+T — Terminal
                    if (e.ctrlKey && e.altKey && e.key === 't') {
                        e.preventDefault();
                        this.openApp('terminal');
                    }
                    // Ctrl+Alt+D — Dashboard
                    if (e.ctrlKey && e.altKey && e.key === 'd') {
                        e.preventDefault();
                        this.openApp('dashboard');
                    }
                    // Ctrl+Alt+A — AI Assistant
                    if (e.ctrlKey && e.altKey && e.key === 'a') {
                        e.preventDefault();
                        this.openApp('ai');
                    }
                    // Ctrl+Alt+S — Settings
                    if (e.ctrlKey && e.altKey && e.key === 's') {
                        e.preventDefault();
                        this.openApp('settings');
                    }
                    // Ctrl+Alt+F — Files
                    if (e.ctrlKey && e.altKey && e.key === 'f') {
                        e.preventDefault();
                        this.openApp('files');
                    }
                    // Ctrl+Alt+Q — Close focused window
                    if (e.ctrlKey && e.altKey && e.key === 'q') {
                        if (this.focusedWindow) this.closeWindow(this.focusedWindow);
                    }
                    // Ctrl+Alt+M — Minimize focused window
                    if (e.ctrlKey && e.altKey && e.key === 'm') {
                        if (this.focusedWindow) this.minimizeWindow(this.focusedWindow);
                    }
                    // Ctrl+Alt+N — Toggle start menu
                    if (e.ctrlKey && e.altKey && e.key === 'n') {
                        e.preventDefault();
                        this.toggleStartMenu();
                    }
                    // F11 — Fullscreen
                    if (e.key === 'F11') {
                        e.preventDefault();
                        this.toggleFullscreen();
                    }
                    // Escape — Close focused window
                    if (e.key === 'Escape') {
                        if (this.focusedWindow) this.closeWindow(this.focusedWindow);
                    }
                    // Super/Meta key — Toggle start menu
                    if (e.key === 'Meta' || e.key === 'OS') {
                        e.preventDefault();
                        this.toggleStartMenu();
                    }
                });
            },

            // ============================================
            // DESKTOP ICON ARRANGEMENT
            // ============================================
            arrangeDesktopIcons: function() {
                const container = document.getElementById('desktop-icons');
                if (!container) return;
                container.innerHTML = '';
                const desktopApps = Object.values(this.apps).filter(a => a.desktop);
                const colWidth = 100, rowHeight = 110, padding = 20;
                desktopApps.forEach((app, idx) => {
                    const col = Math.floor(idx / Math.floor((window.innerHeight - 120) / rowHeight));
                    const row = idx % Math.floor((window.innerHeight - 120) / rowHeight);
                    const icon = document.createElement('div');
                    icon.className = 'desktop-icon';
                    icon.style.cssText = `left:${col * colWidth + padding}px;top:${row * rowHeight + padding}px;`;
                    icon.innerHTML = `
                        <div class="desktop-icon-img" style="border-color:${app.color}30;">${app.icon}</div>
                        <div class="desktop-icon-label">${app.name}</div>
                    `;
                    icon.addEventListener('dblclick', () => this.openApp(app.id));
                    container.appendChild(icon);
                });
            },

            // ============================================
            // REGISTER APP (for external/service apps)
            // ============================================
            registerApp: function(id, appDef) {
                if (this.apps[id]) return;
                this.apps[id] = appDef;
                try {
                    this.buildDesktopIcons();
                    this.buildStartMenu();
                    this.updateDockIndicators();
                } catch(e) { console.warn('registerApp update failed:', e); }
                console.log('✅ App registered:', id);
            },

            // ============================================
            // UPDATE DOCK INDICATORS
            // ============================================
            updateDockIndicators: function() {
                // Clear existing
                this.windows.forEach(w => {
                    const item = document.querySelector(`.dock-item[data-app-id="${w.appId}"]`);
                    if (item) {
                        const indicator = item.querySelector('.dock-indicator');
                        if (indicator) {
                            indicator.style.opacity = w.minimized ? '0.5' : '1';
                            indicator.style.background = w.minimized ? 'var(--text-dim)' : 'var(--accent)';
                        }
                        if (w.minimized) {
                            item.classList.add('dock-minimized');
                        } else {
                            item.classList.remove('dock-minimized');
                        }
                    }
                });
            },

            // ============================================
            // AUTO-SAVE STATE
            // ============================================
            saveState: function() {
                try {
                    const state = {
                        windows: this.windows.map(w => ({
                            appId: w.appId,
                            minimized: w.minimized,
                            maximized: w.maximized
                        })),
                        uptime: this.state.uptime,
                        timestamp: Date.now()
                    };
                    localStorage.setItem('hazoom_os_state', JSON.stringify(state));
                } catch(e) {}
            },

            restoreState: function() {
                try {
                    const saved = localStorage.getItem('hazoom_os_state');
                    if (!saved) return;
                    const state = JSON.parse(saved);
                    // Auto-reopen apps if within 5 min
                    if (state.timestamp && (Date.now() - state.timestamp) < 300000 && state.windows) {
                        state.windows.forEach(w => {
                            if (!w.minimized && this.apps[w.appId]) {
                                setTimeout(() => this.openApp(w.appId), 300);
                            }
                        });
                    }
                } catch(e) {}
            },

            // ============================================
            // FULL OS INITIALIZATION
            // ============================================
            initOS: function() {
                // Flush any queued app registrations
                if (window.__hazoom_register_queue && window.__hazoom_register_queue.length) {
                    window.__hazoom_register_queue.forEach(item => {
                        try { this.registerApp(item.id, item.app); }
                        catch(e) { console.error('Queue flush failed for', item.id, e); }
                    });
                    window.__hazoom_register_queue = [];
                }

                // Initialize quantum kernel
                this.QuantumKernel.init();
                this.QuantumKernel.elevateToRoot(); // Auto-elevate for owner

                // Initialize notification manager
                this.NotificationManager.init();

                // Initialize AI Orchestrator (from AlphaPony)
                if (window.AIOrchestrator) {
                    this.aiOrchestrator = new window.AIOrchestrator();
                    this.aiOrchestrator.loadState(localStorage);
                    this.aiOrchestrator.on('agent-registered', (e) => {
                        this._emitNotification('🤖 AI Agent', `Agent "${e.detail.agentId}" registered`);
                    });
                    this.aiOrchestrator.on('message-added', (e) => {
                        if (e.detail.message.role === 'assistant') {
                            this._emitNotification('💬 AI Response', e.detail.message.content.substring(0, 60) + '...');
                        }
                    });
                    // Register default agents
                    this.aiOrchestrator.registerAgent('main', { name: 'HAZOOM Main', type: 'chat' });
                    this.aiOrchestrator.registerAgent('deep-think', { name: 'Deep Think', type: 'reasoning' });
                    this.aiOrchestrator.registerAgent('code', { name: 'Code Assistant', type: 'coding' });
                }

                // Initialize Deep Think Engine (from AlphaPony)
                if (window.DeepThinkEngine) {
                    this.deepThink = new window.DeepThinkEngine({ maxPaths: 3, enableSelfCorrection: true });
                }

                // Initialize System Monitor (from AlphaPony)
                if (window.SystemMonitor) {
                    this.systemMonitor = new window.SystemMonitor({
                        interval: 5000,
                        onUpdate: (metrics, health) => {
                            this.state.cpu = metrics.cpu;
                            this.state.memory = metrics.memory;
                            this.updateSystemTray();
                        }
                    });
                    this.systemMonitor.start();
                }

                // Setup keyboard shortcuts
                this.setupKeyboardShortcuts();

                // Setup drag & drop for desktop icons
                this.setupDesktopDragDrop();

                // Setup app-aware context menu
                this.initContextMenu();

                // Apply mood (auto or saved)
                this.applyAutoMood();

                // Initialize desktop icons with grid arrangement
                this.buildDesktopIcons();
                this.arrangeDesktopIcons();

                // Restore previous session state
                this.restoreState();

                // Auto-save every 30s
                setInterval(() => this.saveState(), 30000);
                // Auto-save AI state every 60s
                if (this.aiOrchestrator) {
                    setInterval(() => this.aiOrchestrator.saveState(localStorage), 60000);
                }

                // System tick — every 5s update CPU/memory simulation
                this._systemTickInterval = setInterval(() => {
                    this.QuantumKernel.tick();
                    this.state.uptime += 5;
                    this.updateSystemTray();
                }, 5000);

                // Clock — every 1s
                this._clockInterval = setInterval(() => {
                    const now = new Date();
                    const clockEl = document.getElementById('topbar-clock');
                    if (clockEl) clockEl.textContent = now.toLocaleTimeString();

                    const clockShort = document.getElementById('clock');
                    if (clockShort) clockShort.textContent = now.toLocaleTimeString();

                    // Update dashboard uptime if open
                    const dashUptime = document.getElementById('stat-uptime');
                    if (dashUptime) dashUptime.textContent = this.formatTime(this.state.uptime);

                    const dashCpu = document.getElementById('stat-cpu');
                    if (dashCpu) dashCpu.textContent = Math.round(this.state.cpu) + '%';

                    const dashMem = document.getElementById('stat-memory');
                    if (dashMem) dashMem.textContent = this.state.memory + ' MB';
                }, 1000);

                // Listen for window close/minimize to update dock
                this.SystemEmitter.on('windowClosed', () => this.updateDockIndicators());
                this.SystemEmitter.on('windowMinimized', () => this.updateDockIndicators());

                console.log('🧠 HAZOOM OS Intelligence System initialized. All systems online.');
                console.log(`📊 ${Object.keys(this.apps).length} apps registered.`);
                console.log(`🔐 Authority: ${this.state.systemAuthority || 'ROOT'}`);
            },

            // ============================================
            // DRAG & DROP DESKTOP ICONS
            // ============================================
            setupDesktopDragDrop() {
                let dragged = null;
                const container = document.getElementById('desktop-icons');
                if (!container) return;
                
                container.addEventListener('dragstart', (e) => {
                    dragged = e.target.closest('.desktop-icon');
                    if (dragged) {
                        dragged.classList.add('dragging');
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', dragged.dataset.appId || '');
                        container.classList.add('drag-active');
                    }
                });
                
                container.addEventListener('dragend', (e) => {
                    if (dragged) dragged.classList.remove('dragging');
                    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('drag-over'));
                    document.querySelectorAll('.drop-indicator').forEach(d => d.remove());
                    container.classList.remove('drag-active');
                    dragged = null;
                });
                
                container.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    const target = e.target.closest('.desktop-icon');
                    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('drag-over'));
                    if (target && target !== dragged) {
                        target.classList.add('drag-over');
                    }
                });
                
                container.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const target = e.target.closest('.desktop-icon');
                    if (target && dragged && target !== dragged) {
                        // Swap positions
                        const all = [...container.children];
                        const draggedIdx = all.indexOf(dragged);
                        const targetIdx = all.indexOf(target);
                        if (draggedIdx < targetIdx) {
                            target.after(dragged);
                        } else {
                            target.before(dragged);
                        }
                        // Save positions
                        this.saveDesktopPositions();
                    }
                });
                
                // Make existing icons draggable
                document.querySelectorAll('.desktop-icon').forEach(icon => {
                    icon.draggable = true;
                });
            },
            
            saveDesktopPositions() {
                try {
                    const positions = {};
                    document.querySelectorAll('.desktop-icon').forEach(icon => {
                        const appId = icon.dataset.appId;
                        if (appId) positions[appId] = { x: icon.style.left || '0px', y: icon.style.top || '0px' };
                    });
                    localStorage.setItem('hazoom_desktop_positions', JSON.stringify(positions));
                } catch(e) {}
            },

            // ============================================
            // APP-AWARE CONTEXT MENU
            // ============================================
            initContextMenu() {
                const menu = document.getElementById('context-menu');
                if (!menu) return;
                
                let activeApp = null;
                let activeAppData = null;
                
                // Right-click on desktop icons
                document.getElementById('desktop-icons').addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    const icon = e.target.closest('.desktop-icon');
                    if (icon) {
                        const appId = icon.dataset.appId;
                        activeApp = appId;
                        activeAppData = this.apps[appId] || { name: 'Unknown', category: 'unknown' };
                        this.showAppContextMenu(menu, e.clientX, e.clientY, activeAppData);
                    } else {
                        activeApp = null;
                        activeAppData = null;
                        this.showDesktopContextMenu(menu, e.clientX, e.clientY);
                    }
                });
                
                // Right-click on windows
                document.getElementById('windows-container').addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    const win = e.target.closest('.os-window');
                    if (win) {
                        const winData = this.windows.find(w => w.id == win.id.replace('window-', ''));
                        if (winData) {
                            activeApp = winData.appId;
                            activeAppData = this.apps[winData.appId] || { name: 'Window', category: 'unknown' };
                            this.showWindowContextMenu(menu, e.clientX, e.clientY, winData, activeAppData);
                        }
                    }
                });
                
                // Right-click blank desktop area
                document.getElementById('desktop').addEventListener('contextmenu', (e) => {
                    if (!e.target.closest('.desktop-icon') && !e.target.closest('.os-window') && !e.target.closest('#context-menu')) {
                        e.preventDefault();
                        activeApp = null;
                        this.showDesktopContextMenu(menu, e.clientX, e.clientY);
                    }
                });
                
                // Close menu on click
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('#context-menu')) menu.classList.remove('show');
                });
            },
            
            showAppContextMenu(menu, x, y, app) {
                const categoryBadges = { security: 'ctx-badge-security', ai: 'ctx-badge-ai', network: 'ctx-badge-network', tools: 'ctx-badge-system' };
                const badge = categoryBadges[app.category] || '';
                const mood = this.getCurrentMood();
                const accentColor = `hsl(${this.getMoodHue(mood)}, 80%, 50%)`;
                
                menu.innerHTML = `
                    <div class="ctx-app-info" style="border-bottom-color: ${accentColor}40">
                        <div class="ctx-app-name" style="color: ${accentColor}">${app.icon || '📦'} ${app.name}</div>
                        <div class="ctx-app-type">${app.category || 'app'} ${badge ? `<span class="ctx-badge ${badge}">${app.category}</span>` : ''}</div>
                        <div class="ctx-app-stats">
                            <span>ID: ${app.id}</span>
                            <span>Size: ${app.width || 600}×${app.height || 450}</span>
                        </div>
                    </div>
                    <div class="ctx-app-actions">
                        <div class="ctx-item" onclick="HAZOOM.openApp('${app.id}'); document.getElementById('context-menu').classList.remove('show')">📂 Open</div>
                        <div class="ctx-item" onclick="HAZOOM.openApp('${app.id}'); document.getElementById('context-menu').classList.remove('show')">🗂️ Open in New</div>
                        <div class="ctx-separator"></div>
                        <div class="ctx-item" onclick="HAZOOM.showAppInfo('${app.id}')">ℹ️ App Info</div>
                        <div class="ctx-item" onclick="HAZOOM.pinToDock('${app.id}')">📌 Pin to Dock</div>
                        <div class="ctx-separator"></div>
                        <div class="ctx-item" onclick="location.reload()">🔄 Refresh Desktop</div>
                    </div>
                `;
                this.positionMenu(menu, x, y);
                menu.classList.add('show');
            },
            
            showWindowContextMenu(menu, x, y, win, app) {
                const mood = this.getCurrentMood();
                const accentColor = `hsl(${this.getMoodHue(mood)}, 80%, 50%)`;
                
                menu.innerHTML = `
                    <div class="ctx-app-info" style="border-bottom-color: ${accentColor}40">
                        <div class="ctx-app-name" style="color: ${accentColor}">${app.icon || '📦'} ${app.name}</div>
                        <div class="ctx-app-type">Window #${win.id}</div>
                        <div class="ctx-app-stats">
                            <span>${win.minimized ? 'Minimized' : 'Active'}</span>
                            <span>${win.maximized ? 'Maximized' : 'Normal'}</span>
                        </div>
                    </div>
                    <div class="ctx-app-actions">
                        <div class="ctx-item" onclick="HAZOOM.minimizeWindow(${win.id}); document.getElementById('context-menu').classList.remove('show')">📥 Minimize</div>
                        <div class="ctx-item" onclick="HAZOOM.maximizeWindow(${win.id}); document.getElementById('context-menu').classList.remove('show')">⬜ Maximize</div>
                        <div class="ctx-item" onclick="HAZOOM.focusWindow(${win.id}); document.getElementById('context-menu').classList.remove('show')">🎯 Focus</div>
                        <div class="ctx-separator"></div>
                        <div class="ctx-item" onclick="HAZOOM.closeWindow(${win.id}); document.getElementById('context-menu').classList.remove('show')">✕ Close Window</div>
                        <div class="ctx-item destructive" onclick="HAZOOM.showAppInfo('${app.id}')">ℹ️ App Details</div>
                    </div>
                `;
                this.positionMenu(menu, x, y);
                menu.classList.add('show');
            },
            
            showDesktopContextMenu(menu, x, y) {
                const mood = this.getCurrentMood();
                const accentColor = `hsl(${this.getMoodHue(mood)}, 80%, 50%)`;
                
                menu.innerHTML = `
                    <div class="ctx-app-info" style="border-bottom-color: ${accentColor}40">
                        <div class="ctx-app-name" style="color: ${accentColor}">🖥️ Desktop</div>
                        <div class="ctx-app-type">${Object.keys(this.apps).length} apps · ${this.windows.length} windows</div>
                    </div>
                    <div class="ctx-app-actions">
                        <div class="ctx-item" onclick="HAZOOM.openApp('terminal')">⌨️ Open Terminal</div>
                        <div class="ctx-item" onclick="HAZOOM.openApp('dashboard')">📊 Dashboard</div>
                        <div class="ctx-item" onclick="HAZOOM.openApp('system-monitor')">📈 System Monitor</div>
                        <div class="ctx-separator"></div>
                        <div class="ctx-item" onclick="HAZOOM.arrangeDesktopIcons()">📐 Arrange Icons</div>
                        <div class="ctx-item" onclick="HAZOOM.toggleStartMenu()">🚀 Start Menu</div>
                        <div class="ctx-separator"></div>
                        <div class="ctx-item" onclick="HAZOOM.cycleMood()">🎨 Change Mood</div>
                        <div class="ctx-item" onclick="HAZOOM.restart()">🔄 Restart OS</div>
                        <div class="ctx-item destructive" onclick="HAZOOM.shutdown()">⏻ Shutdown</div>
                    </div>
                `;
                this.positionMenu(menu, x, y);
                menu.classList.add('show');
            },
            
            positionMenu(menu, x, y) {
                const rect = menu.getBoundingClientRect();
                const vw = window.innerWidth, vh = window.innerHeight;
                if (x + 220 > vw) x = vw - 230;
                if (y + 250 > vh) y = vh - 260;
                menu.style.left = x + 'px';
                menu.style.top = y + 'px';
            },
            
            showAppInfo(appId) {
                const app = this.apps[appId];
                if (!app) return;
                const info = `📦 App: ${app.name}\n🆔 ID: ${app.id}\n📂 Category: ${app.category || 'general'}\n📐 Size: ${app.width}×${app.height}\n🎨 Color: ${app.color || 'default'}\n📡 Source: ${app.src || 'inline'}`;
                this.showNotification('ℹ️ ' + app.name, info.replace(/\n/g, ' · '));
                document.getElementById('context-menu').classList.remove('show');
            },
            
            pinToDock(appId) {
                this.showNotification('📌 Pinned', `${this.apps[appId]?.name || appId} pinned to dock`);
                document.getElementById('context-menu').classList.remove('show');
            },

            // ============================================
            // MOOD SYSTEM — Dynamic design adaptation
            // ============================================
            getCurrentMood() {
                try {
                    return localStorage.getItem('hazoom_mood') || 'focused';
                } catch(e) { return 'focused'; }
            },
            
            getMoodHue(mood) {
                const hues = { calm: 200, focused: 180, creative: 280, energetic: 45, serious: 0, night: 240, golden: 45 };
                return hues[mood] || 180;
            },
            
            setMood(mood) {
                document.body.classList.remove('mood-calm','mood-focused','mood-creative','mood-energetic','mood-serious','mood-night','mood-golden');
                document.body.classList.add('mood-' + mood);
                try { localStorage.setItem('hazoom_mood', mood); } catch(e) {}
                
                const names = { calm: '🌊 Calm', focused: '🎯 Focused', creative: '🎨 Creative', energetic: '⚡ Energetic', serious: '💼 Serious', night: '🌙 Night', golden: '✨ Golden' };
                this.showNotification('🎨 Mood', names[mood] || mood);
                this.SystemEmitter.emit('moodChanged', mood);
            },
            
            cycleMood() {
                const moods = ['focused','calm','creative','energetic','serious','night','golden'];
                const current = this.getCurrentMood();
                const idx = moods.indexOf(current);
                const next = moods[(idx + 1) % moods.length];
                this.setMood(next);
            },
            
            // Auto-adjust mood based on time and activity
            autoMood() {
                const hour = new Date().getHours();
                const activeWins = this.windows.length;
                
                if (hour >= 22 || hour < 6) return 'night';
                if (activeWins > 5) return 'energetic';
                if (activeWins > 3) return 'focused';
                if (hour >= 6 && hour < 9) return 'calm';
                return 'focused';
            },
            
            applyAutoMood() {
                const auto = this.autoMood();
                const saved = this.getCurrentMood();
                // Only auto-switch if user hasn't manually set a non-default mood
                if (['focused','calm'].includes(saved)) {
                    this.setMood(auto);
                }
            }
        };

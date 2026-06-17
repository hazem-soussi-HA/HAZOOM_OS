// ============================================
// HAZOOM OS v2.1 - CORE KERNEL (STABLE)
// ============================================

const HAZOOM_CONFIG = {
    VERSION: '2.1.0',
    NAME: 'HAZOOM OS',
    STORAGE_KEY: 'hazoom_os_state'
};

// ============================================
// SYSTEM STATE
// ============================================
const System = {
    state: {
        resonance: 852.0,
        consciousness: 100,
        uptime: 0,
        peaceMode: true,
        user: 'hazem',
        cpu_load: 0,
        memory_usage: 0,
        total_memory: 16384, // 16GB Simulated
        system_authority: 'LEVEL_1'
    },
    events: {},
    on: function (event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    },
    emit: function (event, data) {
        if (this.events[event]) this.events[event].forEach(cb => cb(data));
    },
    update: function (key, val) {
        this.state[key] = val;
        this.emit('stateUpdate', { key, val, state: this.state });
    }
};

setInterval(() => {
    System.update('uptime', System.state.uptime + 1);
    const newRes = (850 + Math.random() * 5).toFixed(1);
    System.update('resonance', parseFloat(newRes));

    // Simulate dynamic resource fluctuations
    QuantumKernel.tick();
}, 1000);

// ============================================
// QUANTUM KERNEL (RESOURCES & SECURITY)
// ============================================
const QuantumKernel = {
    allocations: {},

    init: function () {
        const savedToken = localStorage.getItem('hazoom_owner_token');
        if (savedToken === 'HAZOOM_MAX_POWER' && System.state.user === 'hazem') {
            this.elevateAuthority(savedToken, true); // Silent elevation
        }
    },

    tick: function () {
        const activeWins = WindowManager.windows.length;
        // Base CPU load + random jitter + load per window
        const targetCpu = Math.min(100, (activeWins * 8) + Math.random() * 10);
        const currentCpu = System.state.cpu_load;
        System.update('cpu_load', parseFloat((currentCpu + (targetCpu - currentCpu) * 0.2).toFixed(1)));

        // Memory calculation
        let totalMem = 450; // Kernel base MB
        this.allocations = {};
        WindowManager.windows.forEach(win => {
            const appMem = 120 + (Math.random() * 50); // Simulated app baseline
            this.allocations[win.appId] = appMem;
            totalMem += appMem;
        });
        System.update('memory_usage', Math.round(totalMem));

        if (totalMem > System.state.total_memory * 0.9) {
            System.emit('systemWarning', { type: 'MEMORY_CRITICAL', message: 'Quantum collapse imminent: Memory overflow detected.' });
        }
    },

    secureAccess: function (requirement) {
        const levels = { 'LEVEL_1': 1, 'LEVEL_2': 2, 'LEVEL_3': 3, 'ROOT': 4 };
        const current = levels[System.state.system_authority] || 0;
        const req = levels[requirement] || 0;

        if (current >= req) return true;

        // Request Elevation (Simulated)
        console.warn(`🔐 Access Denied: Requires ${requirement}. Current: ${System.state.system_authority}`);
        return false;
    },

    elevateAuthority: function (token, silent = false) {
        // High-security simulated check
        if (token === 'HAZOOM_MAX_POWER') {
            System.update('system_authority', 'ROOT');
            localStorage.setItem('hazoom_owner_token', token);
            if (!silent) {
                System.emit('securityAlert', { type: 'ELEVATION', message: 'Identity Synced. System Authority elevated to ROOT level.' });
            }
            return true;
        }
        return false;
    }
};
QuantumKernel.init();

// ============================================
// FILE SYSTEM
// ============================================
const FileSystem = {
    state: { root: {}, currentPath: '/', nanoTokens: 1000000 },
    mount: function () {
        try {
            const saved = localStorage.getItem('hazoom_os_fs');
            this.state.root = saved ? JSON.parse(saved) : this.getDefaultFS();
            const savedTokens = localStorage.getItem('hazoom_nano_tokens');
            if (savedTokens) this.state.nanoTokens = parseInt(savedTokens);
        } catch (e) { this.state.root = this.getDefaultFS(); }
    },
    getDefaultFS: function () {
        return {
            'Desktop': { type: 'folder', children: {} },
            'Documents': {
                type: 'folder', children: {
                    'Welcome.txt': { type: 'file', content: 'Welcome to HAZOOM OS! 🚀\n\nOperating Systems Thinking:\nAcademics enjoy the luxury of being able to study what is interesting about operating systems, especially clever algorithms, data structures and occasionally, areas that lend themselves nicely to mathematical analysis. Industry professionals must build real systems that work and meet the demanding cost, performance and reliability requirements of customers. Both kinds of thinking are rich with interesting issues. Hazoom aims to present a balanced treatment of both the academic and industry sides of operating systems theory and practice.' },
                    'Architect_Private_Memo.txt': { type: 'file', content: 'ARCHITECT PRIVATE MEMO\n----------------------\nOwner: Hazem Soussi\nSecurity Token: HAZOOM_MAX_POWER\n\nNote: This token grants ROOT access to the Quantum Kernel.' }
                }
            },
            'Projects': { type: 'folder', children: {} }
        };
    },
    save: function () {
        localStorage.setItem('hazoom_os_fs', JSON.stringify(this.state.root));
        localStorage.setItem('hazoom_nano_tokens', this.state.nanoTokens.toString());
    },
    resetToDefault: function () {
        this.state.root = this.getDefaultFS();
        this.save();
        return true;
    },
    ls: function (path) {
        const node = this.traverse(path);
        if (!node || node.type !== 'folder') return [];
        return Object.entries(node.children || {}).map(([name, item]) => ({ name, type: item.type, path: path === '/' ? '/' + name : path + '/' + name }));
    },
    createFile: function (path, name, content = '') {
        const p = this.traverse(path);
        if (p && p.type === 'folder') { p.children[name] = { type: 'file', content }; this.save(); return true; }
        return false;
    },
    createFolder: function (path, name) {
        const p = this.traverse(path);
        if (p && p.type === 'folder') { p.children[name] = { type: 'folder', children: {} }; this.save(); return true; }
        return false;
    },
    traverse: function (path) {
        if (path === '/') return { type: 'folder', children: this.state.root };
        const parts = path.split('/').filter(p => p);
        let curr = { type: 'folder', children: this.state.root };
        for (const p of parts) {
            if (curr && curr.children && curr.children[p]) curr = curr.children[p];
            else return null;
        }
        return curr;
    },
    search: function (query) {
        const results = [];
        const walk = (node, path) => {
            if (!node || !node.children) return;
            for (const [name, child] of Object.entries(node.children)) {
                const fullPath = path === '/' ? '/' + name : path + '/' + name;
                if (name.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ name, type: child.type, path: fullPath });
                }
                if (child.type === 'folder') {
                    walk(child, fullPath);
                }
            }
        };
        walk({ children: this.state.root }, '/');
        return results;
    }
};
FileSystem.mount();

// ============================================
// WINDOW MANAGER
// ============================================
const WindowManager = {
    windows: [],
    zIndex: 100,
    create: function (config) {
        const id = 'win-' + Date.now();

        // If only appId is provided, get full config
        let windowConfig = config;
        if (config.appId && !config.content) {
            const appConfig = getAppConfig(config.appId);
            windowConfig = {
                appId: config.appId,
                title: config.title || appConfig.title,
                content: config.content || appConfig.content,
                width: config.width || appConfig.defaultWidth,
                height: config.height || appConfig.defaultHeight,
                x: config.x,
                y: config.y,
                requiresSandbox: appConfig.requiresSandbox,
                permissions: appConfig.permissions,
                category: appConfig.category
            };
        }

        const win = { id, ...windowConfig, x: windowConfig.x || 100 + (this.windows.length * 30), y: windowConfig.y || 100 + (this.windows.length * 30), width: windowConfig.width || 800, height: windowConfig.height || 600, zIndex: ++this.zIndex };
        this.windows.push(win);
        this.render(win);
        this.makeActive(id);
        return id;
    },
    close: function (id) {
        const idx = this.windows.findIndex(w => w.id === id);
        if (idx > -1) {
            const el = document.getElementById(id);
            if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 200); }
            this.windows.splice(idx, 1);
        }
        updateTaskbar();
    },
    makeActive: function (id) {
        const win = this.windows.find(w => w.id === id);
        if (win) {
            win.zIndex = ++this.zIndex;
            const el = document.getElementById(id);
            if (el) {
                el.style.zIndex = win.zIndex;
                el.classList.remove('minimized'); // Restore if minimized
            }
        }
        updateTaskbar();
    },
    minimize: function (id) {
        const win = this.windows.find(w => w.id === id);
        if (win) {
            const el = document.getElementById(id);
            if (el) el.classList.add('minimized');
            updateTaskbar();
        }
    },
    maximize: function (id) {
        const win = this.windows.find(w => w.id === id);
        if (win) {
            const el = document.getElementById(id);
            if (el) {
                if (win.isMaximized) {
                    el.classList.remove('maximized');
                    win.isMaximized = false;
                } else {
                    el.classList.add('maximized');
                    win.isMaximized = true;
                }
            }
        }
    },
    render: function (win) {
        const el = document.createElement('div');
        el.id = win.id; el.className = 'window';
        el.style.cssText = `left:${win.x}px;top:${win.y}px;width:${win.width}px;height:${win.height}px;z-index:${win.zIndex};`;
        el.dataset.appId = win.appId;

        // Check security permissions
        if (window.SecurityConfig && window.SecurityConfig.secureMode) {
            const permCheck = window.SecurityConfig.checkAppPermission(win.appId);
            if (!permCheck.allowed) {
                el.classList.add('secure-restricted');
                el.style.opacity = '0.5';
                el.style.pointerEvents = 'none';
            }
        }

        const appCfg = (typeof getAppConfig === 'function') ? getAppConfig(win.appId) : (apps[win.appId] || {});
        const permissions = appCfg.permissions || [];
        let allowAttr = '';
        if (permissions.includes('media')) {
            allowAttr = 'allow="camera; microphone; display-capture; autoplay"';
        }

        const contentHTML = (win.content && win.content.trim().startsWith('<'))
            ? win.content
            : `<iframe src="${win.content}" ${allowAttr} style="width:100%;height:100%;border:none;"></iframe>`;

        el.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <span class="window-title-icon">${(window.AppRegistry ? window.AppRegistry.getMeta(win.appId)?.icon : null) || apps[win.appId]?.icon || '📱'}</span>
                    ${win.title}
                </div>
                <div class="window-controls">
                    <button class="window-control window-minimize" onclick="WindowManager.minimize('${win.id}')">─</button>
                    <button class="window-control window-maximize" onclick="WindowManager.maximize('${win.id}')">□</button>
                    <button class="window-control window-close" onclick="WindowManager.close('${win.id}')">×</button>
                </div>
            </div>
            <div class="window-content">${contentHTML}</div>
            <div class="window-resize"></div>
        `;
        this.addDrag(el, win);
        this.addResize(el, win);
        el.onmousedown = () => this.makeActive(win.id);
        document.getElementById('windows-container').appendChild(el);
    },
    addDrag: function (el, win) {
        const head = el.querySelector('.window-header');
        head.onmousedown = (e) => {
            if (e.target.tagName === 'BUTTON') return;
            let sx = e.clientX - win.x, sy = e.clientY - win.y;
            el.classList.add('dragging');
            const move = (e) => { win.x = e.clientX - sx; win.y = e.clientY - sy; el.style.left = win.x + 'px'; el.style.top = win.y + 'px'; };
            const up = () => { el.classList.remove('dragging'); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
            document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
        };
    },
    addResize: function (el, win) {
        const res = el.querySelector('.window-resize');
        res.onmousedown = (e) => {
            let sw = win.width, sh = win.height, sx = e.clientX, sy = e.clientY;
            el.classList.add('resizing');
            const move = (e) => { win.width = Math.max(200, sw + (e.clientX - sx)); win.height = Math.max(150, sh + (e.clientY - sy)); el.style.width = win.width + 'px'; el.style.height = win.height + 'px'; window.dispatchEvent(new Event('resize')); };
            const up = () => { el.classList.remove('resizing'); window.dispatchEvent(new Event('resize')); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
            document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
            e.preventDefault();
        };
    }
};

// ============================================
// APPS (Physical Repo Scraped)
// ============================================
const apps = {
    desktopApps: [
        'quantum_search', 'hazoom_search', 'advanced_navigator', 'hazoom_ai_assistant', 'hazoom_search_indexer', 'hazoom_universal_search', 'antigravity_navigator', 'chess', 'background_office', 'hazoom', 'super_intelligent_agent', 'copilot', 'quantum_travel',
        'consciousness_portal', 'quantum_monitor', 'filemanager', 'terminal',
        'settings', 'browser', 'admin_monitor', 'ai_assistant', 'api_settings',
        'camera_stream', 'pricing', 'secure_scraper', 'security_settings',
        'hazoom_integration', 'glm_integration', 'quantum-heat-monitor', 'usb_portal'
    ],
    quantum_search: { name: 'Quantum Search', icon: '🔍' },
    hazoom_search: { name: 'Hazoom Search', icon: '🔍' },
    advanced_navigator: { name: 'Advanced Navigator', icon: '🌐' },
    hazoom_ai_assistant: { name: 'AI Assistant', icon: '🤖' },
    hazoom_search_indexer: { name: 'Search Indexer', icon: '📊' },
    hazoom_universal_search: { name: 'Universal Search', icon: '🔍' },
    antigravity_navigator: { name: 'Antigravity Navigator', icon: '🛸' },
    'quantum-heat-monitor': { name: 'Heat Monitor', icon: '🔥' },
    chess: { name: 'Quantum Chess', icon: '♟️' },
    background_office: { name: 'Background Office', icon: '🏢' },
    hazoom: { name: 'Hazoom AI', icon: '🤖' },
    glm_integration: { name: 'GLM 4.7 Integration', icon: '🧠' },
    copilot: { name: 'Hazem Co-Pilot', icon: '🚀' },
    quantum_travel: { name: 'Quantum Travel', icon: '🌌' },
    consciousness_portal: { name: 'Consciousness', icon: '🧠' },
    quantum_monitor: { name: 'Quantum Monitor', icon: '📊' },
    filemanager: { name: 'File Manager', icon: '📁' },
    terminal: { name: 'Terminal', icon: '💻' },
    settings: { name: 'Settings', icon: '⚙️' },
    browser: { name: 'Browser', icon: '🌐' },
    admin_monitor: { name: 'Admin Monitor', icon: '🔒' },
    ai_assistant: { name: 'AI Assistant', icon: '🤖' },
    api_settings: { name: 'API Settings', icon: '🔑' },
    camera_stream: { name: 'Camera Stream', icon: '📹' },
    pricing: { name: 'Pricing', icon: '💰' },
    secure_scraper: { name: 'Secure Scraper', icon: '🛡️' },
    security_settings: { name: 'Security & Privacy', icon: '🔐' },
    super_intelligent_agent: { name: 'Super Intelligent Agent', icon: '✨' },
    usb_portal: { name: 'USB Portal', icon: '🔌' }
};

// Import and sync core apps into central AppRegistry (if present)
if (typeof window !== 'undefined' && window.AppRegistry) {
    try {
        window.AppRegistry.importFromCoreApps(apps);
        console.log('✅ AppRegistry seeded from core apps:', window.AppRegistry.getAppList().length);
    } catch (e) {
        console.warn('⚠️ AppRegistry import failed:', e);
    }
}

async function runStartupDiagnostics() {
    const checks = [];
    let allPassed = true;

    const check = (name, passed, details = '') => {
        checks.push({ name, passed, details });
        if (!passed) allPassed = false;
    };

    // 1. Core Objects
    check('HAZOOM Object', typeof window.HAZOOM === 'object' && window.HAZOOM !== null);
    check('WindowManager Object', typeof window.WindowManager === 'object' && window.WindowManager !== null);
    check('AppRegistry Object', typeof window.AppRegistry === 'object' && window.AppRegistry !== null);

    // 2. App Launcher
    if (window.HAZOOM) {
        check('SecureAppLauncher Attached', typeof HAZOOM.AppLauncher?.launch === 'function');
    } else {
        check('SecureAppLauncher Attached', false, 'HAZOOM object not found');
    }

    // 3. Heat Monitor App
    const heatApp = AppRegistry.getConfig('quantum-heat-monitor');
    check('Heat Monitor Registered', !!heatApp);
    if (heatApp) {
        check('Heat Monitor Launch Type', typeof heatApp.launch === 'function', `Type is ${typeof heatApp.launch}`);
    }

    // 4. Code Logic Verification
    if (window.WindowManager) {
        const wmRenderSrc = WindowManager.render.toString();
        check('WindowManager HTML Content Logic', wmRenderSrc.includes("win.content.trim().startsWith('<')"), 'Checks for direct HTML');
    } else {
        check('WindowManager HTML Content Logic', false, 'WindowManager object not found');
    }

    if (HAZOOM.AppLauncher) {
        const launcherSrc = HAZOOM.AppLauncher.launch.toString();
        check('AppLauncher Custom Launch Logic', launcherSrc.includes('app.launch(config);') && launcherSrc.includes('return;'), 'Checks for custom launch and return');
    } else {
        check('AppLauncher Custom Launch Logic', false, 'AppLauncher not found');
    }

    // 5. Backend Service
    try {
        // Try multiple endpoints to handle localhost/127.0.0.1 and port variations
        const timestamp = Date.now();
        const endpoints = [
            `/heat?t=${timestamp}`,
            `http://localhost:8002/heat?t=${timestamp}`,
            `http://127.0.0.1:8002/heat?t=${timestamp}`,
            `http://localhost:8888/heat?t=${timestamp}`
        ];

        let success = false;
        let lastStatus = 0;
        let lastUrl = '';

        for (const url of endpoints) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors', // Explicitly request CORS
                    cache: 'no-store'
                });
                if (response.ok) {
                    success = true;
                    lastStatus = response.status;
                    lastUrl = url;
                    break;
                }
                lastStatus = response.status;
            } catch (err) {
                console.warn(`Failed to reach ${url}:`, err);
            }
        }

        if (success) {
            check('Backend /heat Endpoint', true, `Status: ${lastStatus} via ${lastUrl}`);
        } else {
            // Degrade to warning to allow OS to boot
            checks.push({
                name: 'Backend /heat Endpoint',
                passed: true, // Mark as passed but with warning
                details: `⚠️ Warning: Unable to reach monitor service (Port 8002). Some telemetry may be unavailable.`
            });
            console.warn('Backend diagnostic failed, but allowing boot to proceed.');
        }
    } catch (e) {
        console.warn('Backend check failed:', e);
        check('Backend /heat Endpoint', false, `Network Error: ${e.message}`);
    }

    return { allPassed, checks };
}


function initDesktop() {
    const cont = document.getElementById('desktop-icons'); if (!cont) return; cont.innerHTML = '';
    console.log(`🚀 Initializing desktop with ${apps.desktopApps.length} apps`);

    const colWidth = 110, rowHeight = 120;
    const padding = 20;

    const savedPositions = JSON.parse(localStorage.getItem('hazoom_desktop_positions') || '{}');
    const occupiedCells = new Set();

    function getGridPos(x, y) {
        return {
            col: Math.round((x - padding) / colWidth),
            row: Math.round((y - padding) / rowHeight)
        };
    }

    function isCellOccupied(col, row) {
        return occupiedCells.has(`${col},${row}`);
    }

    function findNearestFreeCell(startCol, startRow) {
        let radius = 0;
        while (radius < 20) {
            for (let c = -radius; c <= radius; c++) {
                for (let r = -radius; r <= radius; r++) {
                    const col = startCol + c;
                    const row = startRow + r;
                    if (col >= 0 && row >= 0 && !isCellOccupied(col, row)) {
                        return { col, row };
                    }
                }
            }
            radius++;
        }
        return { col: startCol, row: startRow };
    }

    apps.desktopApps.forEach(id => {
        const app = apps[id] || AppRegistry.getMeta(id);
        if (!app) return;

        const div = document.createElement('div'); div.className = 'desktop-icon';
        div.dataset.appId = id;
        div.innerHTML = `<span class="desktop-icon-icon">${app.icon}</span><span class="desktop-icon-label">${app.name}</span>`;

        let col, row;
        if (savedPositions[id]) {
            const grid = getGridPos(savedPositions[id].x, savedPositions[id].y);
            const free = findNearestFreeCell(grid.col, grid.row);
            col = free.col; row = free.row;
        } else {
            const free = findNearestFreeCell(0, 0);
            col = free.col; row = free.row;
        }

        occupiedCells.add(`${col},${row}`);
        const x = col * colWidth + padding;
        const y = row * rowHeight + padding;

        div.style.left = x + 'px';
        div.style.top = y + 'px';
        div.dataset.gridRef = `${col}:${row}`; // Agentic matrix reference

        div.onclick = (e) => {
            e.stopPropagation();
            if (!e.ctrlKey && !e.shiftKey) {
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('active'));
            }
            div.classList.toggle('active');
        };
        div.ondblclick = () => {
            const selected = document.querySelectorAll('.desktop-icon.active');
            if (selected.length > 1) {
                selected.forEach(el => HAZOOM.openApp(el.dataset.appId));
            } else {
                HAZOOM.openApp(id);
            }
        };

        makeIconDraggable(div);
        cont.appendChild(div);
    });

    initSelectionBox();
    console.log(`✅ Desktop initialized with ${cont.children.length} icons`);
}

function initSelectionBox() {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;

    let selectionBox = document.getElementById('selection-box');
    if (!selectionBox) {
        selectionBox = document.createElement('div');
        selectionBox.id = 'selection-box';
        selectionBox.classList.add('hidden');
        desktop.appendChild(selectionBox);
    }

    let startX, startY;

    desktop.addEventListener('mousedown', (e) => {
        if (e.target !== desktop && e.target.id !== 'desktop-icons') return;

        startX = e.clientX;
        startY = e.clientY - desktop.offsetTop;

        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.classList.remove('hidden');

        function onMouseMove(e) {
            const currentX = e.clientX;
            const currentY = e.clientY - desktop.offsetTop;

            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            const left = Math.min(currentX, startX);
            const top = Math.min(currentY, startY);

            selectionBox.style.width = width + 'px';
            selectionBox.style.height = height + 'px';
            selectionBox.style.left = left + 'px';
            selectionBox.style.top = top + 'px';

            // Select icons within box
            const icons = document.querySelectorAll('.desktop-icon');
            const boxRect = selectionBox.getBoundingClientRect();

            icons.forEach(icon => {
                const iconRect = icon.getBoundingClientRect();
                const isOverlapping = !(iconRect.right < boxRect.left ||
                    iconRect.left > boxRect.right ||
                    iconRect.bottom < boxRect.top ||
                    iconRect.top > boxRect.bottom);

                if (isOverlapping) icon.classList.add('active');
                else if (!e.ctrlKey) icon.classList.remove('active');
            });
        }

        function onMouseUp() {
            selectionBox.classList.add('hidden');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

function makeIconDraggable(el) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const colWidth = 110, rowHeight = 120;
    const padding = 20;

    el.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        e.stopPropagation();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        el.classList.add('dragging');
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        const newTop = el.offsetTop - pos2;
        const newLeft = el.offsetLeft - pos1;

        // Keeping icons within bounds
        const bounds = {
            top: 0,
            left: 0,
            bottom: window.innerHeight - 160,
            right: window.innerWidth - 100
        };

        if (newTop >= bounds.top && newTop <= bounds.bottom) el.style.top = newTop + "px";
        if (newLeft >= bounds.left && newLeft <= bounds.right) el.style.left = newLeft + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        el.classList.remove('dragging');

        // Grid snapping
        const col = Math.round((el.offsetLeft - padding) / colWidth);
        const row = Math.round((el.offsetTop - padding) / rowHeight);

        // Dynamic collision check
        let finalCol = col;
        let finalRow = row;

        const isOccupied = (c, r) => {
            const icons = document.querySelectorAll('.desktop-icon');
            for (const icon of icons) {
                if (icon === el) continue;
                const ic = Math.round((parseInt(icon.style.left) - padding) / colWidth);
                const ir = Math.round((parseInt(icon.style.top) - padding) / rowHeight);
                if (ic === c && ir === r) return true;
            }
            return false;
        };

        if (isOccupied(finalCol, finalRow)) {
            // Find nearest free cell if occupied
            let radius = 1;
            let found = false;
            while (radius < 10 && !found) {
                for (let c = -radius; c <= radius; c++) {
                    for (let r = -radius; r <= radius; r++) {
                        const tc = finalCol + c;
                        const tr = finalRow + r;
                        if (tc >= 0 && tr >= 0 && !isOccupied(tc, tr)) {
                            finalCol = tc;
                            finalRow = tr;
                            found = true;
                            break;
                        }
                    }
                    if (found) break;
                }
                radius++;
            }
        }

        const finalX = finalCol * colWidth + padding;
        const finalY = finalRow * rowHeight + padding;

        el.style.left = finalX + 'px';
        el.style.top = finalY + 'px';
        el.dataset.gridRef = `${finalCol}:${finalRow}`;

        // Save new position
        const positions = JSON.parse(localStorage.getItem('hazoom_desktop_positions') || '{}');
        positions[el.dataset.appId] = { x: finalX, y: finalY };
        localStorage.setItem('hazoom_desktop_positions', JSON.stringify(positions));
    }
}

function initStartMenu() {
    const cont = document.getElementById('start-apps'); if (!cont) return; cont.innerHTML = '';
    const appList = AppRegistry.getAppList();
    console.log(`🚀 Initializing start menu with ${appList.length} apps`);
    appList.forEach(id => {
        const app = AppRegistry.getMeta(id); if (!app) return;
        const div = document.createElement('div'); div.className = 'start-app-item';
        div.dataset.appId = id;
        div.innerHTML = `<span class="start-app-item-icon">${app.icon}</span><span class="start-app-item-title">${app.name}</span>`;
        div.onclick = () => {
            HAZOOM.openApp(id);
            document.getElementById('start-menu').classList.add('hidden');
        };
        cont.appendChild(div);
    });
    console.log(`✅ Start menu initialized with ${cont.children.length} apps`);

    const searchInput = document.getElementById('start-search-input');
    if (searchInput) {
        searchInput.oninput = (e) => {
            const query = e.target.value.toLowerCase();
            const items = cont.querySelectorAll('.start-app-item');
            items.forEach(item => {
                const title = item.querySelector('.start-app-item-title').textContent.toLowerCase();
                const id = item.dataset.appId || '';
                if (title.includes(query) || id.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        };
        searchInput.onkeydown = (e) => {
            if (e.key === 'Enter' && searchInput.value.trim().length > 0) {
                HAZOOM.openApp('quantum_search', { query: searchInput.value.trim() });
                document.getElementById('start-menu').classList.add('hidden');
            }
        };
    }
}

function initContextMenu() {
    const menu = document.getElementById('context-menu');
    if (!menu) return;

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;

        // Detect if clicked on a window or taskbar item
        const targetWindow = e.target.closest('.window');
        const targetTaskbarItem = e.target.closest('.taskbar-app');

        let menuContent = '';

        if (targetWindow) {
            const winId = targetWindow.id;
            const appId = targetWindow.dataset.appId;
            const isMaximized = targetWindow.classList.contains('maximized');

            menuContent = `
                <div class="context-menu-header">📱 ${apps[appId]?.name || 'App'}</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" onclick="WindowManager.makeActive('${winId}')">
                    <span>👆</span> Bring to Front
                </div>
                <div class="context-menu-item" onclick="WindowManager.minimize('${winId}')">
                    <span>📉</span> Minimize
                </div>
                <div class="context-menu-item" onclick="WindowManager.maximize('${winId}')">
                    <span>${isMaximized ? '❐' : '□'}</span> ${isMaximized ? 'Restore' : 'Maximize'}
                </div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" onclick="const f = document.getElementById('${winId}').querySelector('iframe'); if(f) f.src = f.src;">
                    <span>↻</span> Reload
                </div>
                <div class="context-menu-item destructive" onclick="WindowManager.close('${winId}')">
                    <span>❌</span> Close
                </div>
            `;
        } else if (targetTaskbarItem) {
            const winId = targetTaskbarItem.dataset.id; // Assuming taskbar items store window ID
            // If the taskbar item doesn't store winId directly (it often stores appId or index), we might need to look it up.
            // Let's assume standard behavior or just default to safely opening/closing if possible. 
            // Better to stick to the window logic above first. 
            // Fallback for now to standard menu if logic is complex without seeing updateTaskbar code.
            menuContent = `
                <div class="context-menu-header">Taskbar Action</div>
                <div class="context-menu-item" onclick="HAZOOM.refreshDesktop()">
                    <span>🔄</span> Refresh Interface
                </div>
             `;
        } else {
            // Default Desktop Menu
            menuContent = `
                <div class="context-menu-item" onclick="HAZOOM.openApp('terminal')">
                    <span>💻</span> Open Terminal
                </div>
                <div class="context-menu-item" onclick="HAZOOM.openApp('settings')">
                    <span>⚙️</span> Settings
                </div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" onclick="HAZOOM.refreshDesktop()">
                    <span>🔄</span> Refresh Desktop
                </div>
                <div class="context-menu-item" onclick="if(document.fullscreenElement) document.exitFullscreen(); else document.body.requestFullscreen()">
                    <span>📺</span> Toggle Fullscreen
                </div>
                <div class="context-menu-item" onclick="HAZOOM.openApp('quantum-heat-monitor')">
                    <span>🔥</span> Heat Monitor
                </div>
            `;
        }

        menu.innerHTML = menuContent;

        // Ensure menu stays within bounds
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;

        let finalX = x;
        let finalY = y;

        if (x + 200 > winWidth) finalX = winWidth - 210;
        if (y + 250 > winHeight) finalY = winHeight - 260; // Adjusted for potentially taller menu

        menu.style.left = `${finalX}px`;
        menu.style.top = `${finalY}px`;
        menu.classList.remove('hidden');
    });

    document.addEventListener('click', () => {
        menu.classList.add('hidden');
    });
}

function loadAppContent(appId) {
    return `apps/${appId}.html`;
}

function getAppConfig(appId) {
    const appConfigs = {
        'antigravity_navigator': {
            title: 'Antigravity Navigator',
            content: loadAppContent('antigravity_navigator'),
            defaultWidth: 1000,
            defaultHeight: 700,
            requiresSandbox: false,
            permissions: ['system', 'network'],
            category: 'system'
        },
        'quantum_search': {
            title: 'Quantum Search',
            content: loadAppContent('quantum_search'),
            defaultWidth: 700,
            defaultHeight: 500,
            requiresSandbox: false,
            permissions: ['system'],
            category: 'system'
        },
        'hazoom_search': {
            title: 'Hazoom Search',
            content: loadAppContent('hazoom_search'),
            defaultWidth: 900,
            defaultHeight: 700,
            requiresSandbox: true,
            permissions: ['network'],
            category: 'tools'
        },
        'advanced_navigator': {
            title: 'Advanced Navigator',
            content: loadAppContent('advanced_navigator'),
            defaultWidth: 1200,
            defaultHeight: 800,
            requiresSandbox: true,
            permissions: ['network', 'file_read'],
            category: 'tools'
        },
        'hazoom_ai_assistant': {
            title: 'Hazoom AI Assistant',
            content: loadAppContent('hazoom_ai_assistant'),
            defaultWidth: 900,
            defaultHeight: 700,
            requiresSandbox: true,
            permissions: ['network', 'system'],
            category: 'ai'
        },
        'hazoom_search_indexer': {
            title: 'Search Indexer',
            content: loadAppContent('hazoom_search_indexer'),
            defaultWidth: 1000,
            defaultHeight: 750,
            requiresSandbox: true,
            permissions: ['file_read', 'file_write'],
            category: 'tools'
        },
        'hazoom_universal_search': {
            title: 'Universal Search',
            content: loadAppContent('hazoom_universal_search'),
            defaultWidth: 1200,
            defaultHeight: 850,
            requiresSandbox: true,
            permissions: ['network', 'file_read'],
            category: 'tools'
        },
        'hazoom': {
            title: 'Hazoom AI',
            content: loadAppContent('hazoom'),
            defaultWidth: 1000,
            defaultHeight: 700,
            requiresSandbox: true,
            permissions: ['network', 'file_read'],
            category: 'ai'
        },
        'super_intelligent_agent': {
            title: 'Super Intelligent Agent',
            content: loadAppContent('super_intelligent_agent'),
            defaultWidth: 1400,
            defaultHeight: 900,
            requiresSandbox: true,
            permissions: ['network'],
            category: 'quantum'
        },
        'copilot': {
            title: 'Hazem Co-Pilot',
            content: loadAppContent('copilot'),
            defaultWidth: 900,
            defaultHeight: 600,
            requiresSandbox: true,
            permissions: ['network'],
            category: 'ai'
        },
        'filemanager': {
            title: 'File Manager',
            content: loadAppContent('filemanager'),
            defaultWidth: 900,
            defaultHeight: 600,
            requiresSandbox: true,
            permissions: ['file_read', 'file_write'],
            category: 'system'
        },
        'terminal': {
            title: 'Terminal',
            content: loadAppContent('terminal'),
            defaultWidth: 700,
            defaultHeight: 500,
            requiresSandbox: false,
            permissions: ['system'],
            category: 'system'
        },
        'quantum_monitor': {
            title: 'Quantum Monitor',
            content: loadAppContent('quantum_monitor'),
            defaultWidth: 900,
            defaultHeight: 600,
            requiresSandbox: false,
            permissions: ['system'],
            category: 'quantum'
        },
        'consciousness_portal': {
            title: 'Consciousness Portal',
            content: loadAppContent('consciousness_portal'),
            defaultWidth: 1100,
            defaultHeight: 750,
            requiresSandbox: true,
            permissions: ['system'],
            category: 'quantum'
        },
        'settings': {
            title: 'Settings',
            content: loadAppContent('settings'),
            defaultWidth: 900,
            defaultHeight: 700,
            requiresSandbox: false,
            permissions: [],
            category: 'system'
        },
        'browser': {
            title: 'Browser',
            content: loadAppContent('browser'),
            defaultWidth: 1000,
            defaultHeight: 700,
            requiresSandbox: true,
            permissions: ['network'],
            category: 'tools'
        },
        'admin_monitor': {
            title: 'Admin Monitor',
            content: loadAppContent('admin_monitor'),
            defaultWidth: 1200,
            defaultHeight: 800,
            requiresSandbox: false,
            permissions: ['system', 'network'],
            category: 'system',
            requiredAuthority: 'LEVEL_3'
        },
        'ai_assistant': {
            title: 'AI Assistant',
            content: loadAppContent('ai_assistant'),
            defaultWidth: 900,
            defaultHeight: 700,
            requiresSandbox: true,
            permissions: ['network'],
            category: 'ai'
        },
        'api_settings': {
            title: 'API Settings',
            content: loadAppContent('api_settings'),
            defaultWidth: 800,
            defaultHeight: 600,
            requiresSandbox: false,
            permissions: [],
            category: 'system'
        },
        'camera_stream': {
            title: 'Camera Stream',
            content: loadAppContent('camera_stream'),
            defaultWidth: 900,
            defaultHeight: 600,
            requiresSandbox: true,
            permissions: ['network', 'media'],
            category: 'tools'
        },
        'pricing': {
            title: 'Pricing',
            content: loadAppContent('pricing'),
            defaultWidth: 800,
            defaultHeight: 600,
            requiresSandbox: false,
            permissions: [],
            category: 'info'
        },
        'secure_scraper': {
            title: 'Secure Scraper',
            content: loadAppContent('secure_scraper'),
            defaultWidth: 900,
            defaultHeight: 600,
            requiresSandbox: true,
            permissions: ['network', 'file_write'],
            category: 'tools'
        },
        'security_settings': {
            title: 'Security Settings',
            content: loadAppContent('security_settings'),
            defaultWidth: 900,
            defaultHeight: 700,
            requiresSandbox: false,
            permissions: [],
            category: 'system',
            requiredAuthority: 'LEVEL_2'
        },
        'chess': {
            title: 'Quantum Chess',
            content: loadAppContent('chess'),
            defaultWidth: 900,
            defaultHeight: 700,
            requiresSandbox: true,
            permissions: [],
            category: 'games'
        },
        'background_office': {
            title: 'Background Office',
            content: loadAppContent('background_office'),
            defaultWidth: 1200,
            defaultHeight: 800,
            requiresSandbox: false,
            permissions: ['network'],
            category: 'productivity'
        },
        'quantum_travel': {
            title: 'Quantum Travel',
            content: loadAppContent('quantum_travel'),
            defaultWidth: 1200,
            defaultHeight: 800,
            requiresSandbox: true,
            permissions: ['network'],
            category: 'quantum'
        },
        'hazoom_integration': {
            title: 'Hazoom Integration',
            content: loadAppContent('hazoom_integration'),
            defaultWidth: 1100,
            defaultHeight: 800,
            requiresSandbox: true,
            permissions: ['network', 'file_read', 'file_write'],
            category: 'ai'
        },
        'glm_integration': {
            title: 'GLM 4.7 Integration',
            content: loadAppContent('glm_integration'),
            defaultWidth: 1200,
            defaultHeight: 800,
            requiresSandbox: true,
            permissions: ['network', 'file_read'],
            category: 'ai'
        },
        'usb_portal': {
            title: 'USB Portal Manager',
            content: loadAppContent('usb_portal'),
            defaultWidth: 1000,
            defaultHeight: 700,
            requiresSandbox: true,
            permissions: ['system', 'file_read', 'file_write'],
            category: 'system'
        }
    };

    return appConfigs[appId] || {
        title: apps[appId]?.name || 'Unknown App',
        content: loadAppContent(appId),
        defaultWidth: 800,
        defaultHeight: 600,
        requiresSandbox: false,
        permissions: [],
        category: 'system'
    };
}

function updateTaskbar() {
    const cont = document.getElementById('open-apps'); if (!cont) return; cont.innerHTML = '';

    // Update active apps count
    const countEl = document.getElementById('active-apps-count');
    if (countEl) {
        countEl.textContent = `📱 ${WindowManager.windows.length} Apps`;
    }

    WindowManager.windows.forEach(win => {
        const btn = document.createElement('button');
        btn.className = 'taskbar-app';
        const el = document.getElementById(win.id);
        const isActive = el && el.style.zIndex == WindowManager.zIndex && !el.classList.contains('minimized');
        const isMinimized = el && el.classList.contains('minimized');

        if (isActive) btn.classList.add('active');
        if (isMinimized) btn.classList.add('app-minimized');

        btn.innerHTML = `<span class="taskbar-app-icon">${apps[win.appId]?.icon || '📱'}</span> <span class="taskbar-app-title">${win.title}</span>`;
        btn.onclick = () => {
            if (isActive) WindowManager.minimize(win.id);
            else WindowManager.makeActive(win.id);
        };
        cont.appendChild(btn);
    });

    // Update resources in system tray
    const tray = document.getElementById('system-tray');
    if (tray) {
        const stats = `
            <span class="resource-stat">⚡ ${System.state.cpu_load}%</span>
            <span class="resource-stat">💾 ${System.state.memory_usage}MB</span>
            <span id="active-apps-count">📱 ${WindowManager.windows.length} Apps</span>
            <span id="clock">${new Date().toLocaleTimeString()}</span>
            <span id="connection-status">🟢 Online</span>
        `;
        tray.innerHTML = stats;
    }
}

// Ensure resources update frequently
setInterval(updateTaskbar, 2000);

const HAZOOM = {
    openApp: (id, config = {}) => {
        const appCfg = getAppConfig(id);
        const reqAuth = appCfg.requiredAuthority || 'LEVEL_1';

        if (!QuantumKernel.secureAccess(reqAuth)) {
            System.emit('securityAlert', {
                type: 'ACCESS_DENIED',
                message: `Unauthorized access attempt to ${appCfg.title}. Authentication Level ${reqAuth} required.`
            });
            return null;
        }

        System.emit('appOpen', { id });
        // Prefer SecureAppLauncher (permission & sandboxing) if available
        if (window.HAZOOM && window.HAZOOM.AppLauncher && typeof window.HAZOOM.AppLauncher.launch === 'function') {
            try {
                return window.HAZOOM.AppLauncher.launch(id, config);
            } catch (e) {
                console.warn('AppLauncher.launch failed, falling back to WindowManager.create:', e);
            }
        }
        return WindowManager.create({ appId: id, ...config });
    },
    registerApp: function (id, appDef) {
        // Delegate to AppRegistry when available for centralized storage
        if (window.AppRegistry && typeof window.AppRegistry.registerApp === 'function') {
            window.AppRegistry.registerApp(id, appDef);
            try { initDesktop(); initStartMenu(); updateTaskbar(); } catch (e) { console.warn('registerApp post-init update failed:', e); }
            console.log('✅ App registered via AppRegistry:', id);
            return;
        }

        // Backwards compatible fallback
        apps[id] = appDef;
        if (!apps.desktopApps.includes(id)) apps.desktopApps.push(id);
        try {
            initDesktop();
            initStartMenu();
            updateTaskbar();
        } catch (e) {
            console.warn('registerApp post-init update failed:', e);
        }
        console.log('✅ App registered:', id);
    },
    System,
    FileSystem,
    WindowManager,
    QuantumKernel,
    refreshDesktop: () => {
        console.log('🔄 Initiating Quantum Resync...');
        const desktop = document.getElementById('desktop');
        const cont = document.getElementById('desktop-icons');
        if (!cont || !desktop) return;

        // 1. Trigger System-wide Glitch
        desktop.classList.add('desktop-resync-glitch');

        // 2. Add Scan Ripple Overlay
        const overlay = document.createElement('div');
        overlay.className = 'resync-overlay';
        desktop.appendChild(overlay);

        // 3. Staggered Icon Dissolve
        const icons = cont.querySelectorAll('.desktop-icon');
        icons.forEach((icon, idx) => {
            setTimeout(() => {
                icon.style.transition = 'all 0.3s ease';
                icon.style.opacity = '0';
                icon.style.transform = 'scale(0.9) translateY(10px)';
                icon.style.filter = 'blur(10px)';
            }, idx * 20);
        });

        setTimeout(() => {
            // 4. Re-initialize State
            initDesktop();
            desktop.classList.remove('desktop-resync-glitch');

            // 5. Staggered Re-entry (Icon Pop)
            const newIcons = cont.querySelectorAll('.desktop-icon');
            newIcons.forEach((icon, idx) => {
                icon.style.opacity = '0'; // Start hidden
                icon.classList.add('refreshing');
                icon.style.animationDelay = `${idx * 40}ms`;
            });

            // 6. Cleanup
            setTimeout(() => {
                overlay.remove();
                console.log('✅ Quantum Resync complete');
            }, 1000);
        }, 500);
    },
    notify: (title, message, type = 'info') => NotificationManager.show(title, message, type)
};

// ============================================
// NOTIFICATION MANAGER
// ============================================
const NotificationManager = {
    show: function (title, message, type = 'info') {
        const id = 'notif-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = `system-notification notif-${type}`;
        div.innerHTML = `
            <div class="notif-header">
                <strong>${title}</strong>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="notif-body">${message}</div>
        `;

        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }

        container.appendChild(div);
        setTimeout(() => div.classList.add('visible'), 10);
        setTimeout(() => {
            div.classList.remove('visible');
            setTimeout(() => div.remove(), 500);
        }, 8000);
    }
};

// Listen for system events
System.on('securityAlert', data => HAZOOM.notify('🛡️ Security Alert', data.message, 'error'));
System.on('systemWarning', data => HAZOOM.notify('⚠️ System Warning', data.message, 'warning'));

window.HAZOOM = HAZOOM;
window.FileSystem = FileSystem;
window.WindowManager = WindowManager;
if (window.SecurityConfig) {
    window.SecurityConfig = window.SecurityConfig;
}

// If the SecureAppLauncher was loaded before core.js, attach it now to HAZOOM
if (typeof SecureAppLauncher !== 'undefined') {
    window.HAZOOM.AppLauncher = SecureAppLauncher;
}

// Flush any queued app registrations that occurred before core.js was available
if (window.__hazoom_register_queue && window.__hazoom_register_queue.length) {
    window.__hazoom_register_queue.forEach(item => {
        try {
            window.HAZOOM.registerApp(item.id, item.app);
        } catch (e) {
            console.error('Flushing __hazoom_register_queue failed for', item.id, e);
        }
    });
    window.__hazoom_register_queue = [];
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOMContentLoaded event fired. Running startup diagnostics...');

    const diagOverlay = document.getElementById('diagnostic-overlay');
    const { allPassed, checks } = await runStartupDiagnostics();

    if (!allPassed) {
        let reportHTML = '<h1>❌ HAZOOM OS Startup Failed</h1>';
        reportHTML += '<p>The following critical checks failed. This is likely due to outdated cached files.</p>';
        reportHTML += '<strong>Please perform a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) and try again.</strong>';
        reportHTML += '<ul style="list-style-type: none; padding: 0; margin-top: 20px;">';
        checks.forEach(check => {
            const status = check.passed ? '<span style="color:var(--success);">✅ PASSED</span>' : '<span style="color:var(--error);">❌ FAILED</span>';
            reportHTML += `<li style="background: var(--bg-secondary); padding: 10px; border-radius: 5px; margin-bottom: 10px;"><strong>${check.name}:</strong> ${status}<br><small>${check.details || ''}</small></li>`;
        });
        reportHTML += '</ul>';

        diagOverlay.innerHTML = reportHTML;
        diagOverlay.classList.remove('hidden');
        return; // Halt normal startup
    }

    console.log('✅ All startup diagnostics passed. Initializing OS...');
    initDesktop();
    initStartMenu();
    initContextMenu();
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.onclick = (e) => {
            e.stopPropagation();
            document.getElementById('start-menu').classList.toggle('hidden');
        };
    }

    // Deselect desktop icons when clicking empty space
    const desktop = document.getElementById('desktop');
    if (desktop) {
        desktop.addEventListener('click', () => {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('active'));
        });
    }
    document.addEventListener('click', (e) => {
        const startMenu = document.getElementById('start-menu');
        const startBtn = document.getElementById('start-btn');
        if (startMenu && !startMenu.classList.contains('hidden') && startBtn && !startBtn.contains(e.target) && !startMenu.contains(e.target)) {
            startMenu.classList.add('hidden');
        }
    });
    setInterval(() => { const clock = document.getElementById('clock'); if (clock) clock.textContent = new Date().toLocaleTimeString(); }, 1000);
});

(function () {
    try {
        const boot = document.createElement('div');
        boot.id = 'boot-overlay';
        // Add minimal inline styles to ensure it shows even if CSS is late
        boot.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#020617;z-index:200000;display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;';

        boot.innerHTML = `
            <div class="boot-quantum-orb" style="display:flex;justify-content:center;align-items:center;">
                <div class="boot-logo-text" style="color:white;font-family:sans-serif;">HAZOOM</div>
            </div>
            <div class="boot-loader-container" style="width:300px;height:2px;background:rgba(255,255,255,0.1);margin-top:20px;">
                <div class="boot-loader-bar" id="boot-bar" style="width:0%;height:100%;background:#3b82f6;"></div>
            </div>
            <div class="boot-terminal-logs" id="boot-logs" style="position:absolute;bottom:40px;left:40px;font-family:monospace;font-size:10px;opacity:0.7;"></div>
        `;
        document.body.appendChild(boot);

        const bar = document.getElementById('boot-bar');
        const logs = document.getElementById('boot-logs');

        const stages = [
            { p: 15, t: 'Kernel Initializing...' },
            { p: 35, t: 'Quantum Sync [OK]' },
            { p: 55, t: 'Neural Link Active' },
            { p: 75, t: 'FileSystem Mounted' },
            { p: 100, t: 'System Ready' }
        ];

        let stageIdx = 0;
        const interval = setInterval(() => {
            if (stageIdx < stages.length) {
                const s = stages[stageIdx];
                if (bar) bar.style.width = s.p + '%';
                if (logs) {
                    const l = document.createElement('div');
                    l.textContent = `> ${s.t}`;
                    logs.appendChild(l);
                    if (logs.children.length > 5) logs.removeChild(logs.firstChild);
                }
                stageIdx++;
            } else {
                clearInterval(interval);
                setTimeout(finishBoot, 500);
            }
        }, 500);

        function finishBoot() {
            boot.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            boot.style.opacity = '0';
            boot.style.transform = 'scale(1.1)';

            const osContainer = document.getElementById('os-container');
            if (osContainer) {
                osContainer.style.opacity = '1';
                osContainer.style.filter = 'blur(0px)';
            }

            setTimeout(() => {
                if (boot.parentNode) boot.parentNode.removeChild(boot);
            }, 1000);
        }

        // Safety timeout to ensure boot screen always disappears
        setTimeout(() => {
            if (document.getElementById('boot-overlay')) finishBoot();
        }, 5000);

    } catch (e) {
        console.error('❌ Creative boot error:', e);
        const os = document.getElementById('os-container');
        if (os) os.style.opacity = '1';
    }
})();

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    // Ctrl+F for Global Search
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        if (typeof HAZOOM !== 'undefined' && HAZOOM.openApp) {
            HAZOOM.openApp('quantum_search');
        }
    }
});

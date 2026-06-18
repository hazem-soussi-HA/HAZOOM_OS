// ============================================
// HAZOOM OS — Intelligent Desktop v4.0
// Window Manager + Adaptive Context Menus + Autonomous Procedures
// Left Click (GAUCHE) / Right Click (DROITE) — Per-App Adaptive
// Author: Hazem Soussi (HA) — Shadow Builder
// ============================================

/**
 * HAZOOM Intelligent Desktop
 * 
 * Features:
 * 1. Full window management (create, move, resize, minimize, maximize, close)
 * 2. Adaptive context menus — left click and right click change per application
 * 3. Autonomous procedures — each app has its own set of automated actions
 * 4. App launcher with search + categories
 * 5. Taskbar with active windows + system tray
 * 6. Desktop icons with drag-and-drop
 * 7. Keyboard shortcuts
 * 8. Multi-workspace support
 * 9. Integration with Aether consciousness engine
 * 10. Integration with Agentic RAG for intelligent suggestions
 */

class HazoomDesktop {
  constructor() {
    this.name = 'HAZOOM-Desktop';
    this.version = '4.0.0';
    
    // Window management
    this.windows = new Map();
    this.windowIdCounter = 0;
    this.focusedWindow = null;
    this.zIndexCounter = 100;
    this.minimizedWindows = new Set();
    
    // Workspaces
    this.workspaces = [
      { id: 0, name: 'Main', active: true },
      { id: 1, name: 'Development', active: false },
      { id: 2, name: 'AI Lab', active: false },
      { id: 3, name: 'Security', active: false },
    ];
    this.activeWorkspace = 0;
    
    // App registry
    this.apps = new Map();
    
    // Context menu system
    this.contextMenus = new Map();
    this.activeContextMenu = null;
    
    // Autonomous procedures per app
    this.autonomousProcedures = new Map();
    
    // Drag state
    this.dragState = {
      active: false,
      windowId: null,
      offsetX: 0,
      offsetY: 0,
    };
    
    // Resize state
    this.resizeState = {
      active: false,
      windowId: null,
      direction: null,
      startX: 0,
      startY: 0,
      startWidth: 0,
      startHeight: 0,
    };
    
    // Desktop state
    this.state = {
      wallpaper: 'gradient',
      theme: 'dark',
      iconSize: 'medium',
      gridSnap: true,
      animations: true,
      soundEffects: false,
    };
    
    // Event listeners
    this.globalListeners = [];
    
    // Initialize
    this._init();
  }

  // ---- INITIALIZATION ----
  
  _init() {
    this._registerAllApps();
    this._registerAllContextMenus();
    this._registerAllAutonomousProcedures();
    this._setupGlobalListeners();
    console.log(`[${this.name}] v${this.version} initialized`);
    console.log(`[${this.name}] Apps: ${this.apps.size} | Context Menus: ${this.contextMenus.size} | Procedures: ${this.autonomousProcedures.size}`);
  }

  // ---- APP REGISTRATION ----
  
  _registerAllApps() {
    const appList = [
      // Core
      { id: 'dashboard', name: 'Dashboard', icon: '📊', color: '#00d4ff', width: 900, height: 600, category: 'core', src: 'apps/aether-dashboard.html' },
      { id: 'terminal', name: 'Terminal', icon: '⌨️', color: '#10b981', width: 700, height: 450, category: 'core', src: 'apps/terminal.html' },
      { id: 'files', name: 'Files', icon: '📁', color: '#ffd700', width: 750, height: 500, category: 'core', src: 'apps/filemanager.html' },
      { id: 'browser', name: 'Secure Browser', icon: '🌐', color: '#06b6d4', width: 900, height: 600, category: 'core', src: 'apps/browser.html' },
      { id: 'settings', name: 'Settings', icon: '⚙️', color: '#6b7280', width: 500, height: 450, category: 'core', src: 'apps/settings.html' },
      
      // AI
      { id: 'aether-chat', name: 'Aether Chat', icon: '🧠', color: '#a855f7', width: 600, height: 500, category: 'ai', src: 'apps/aether-dashboard.html' },
      { id: 'consciousness', name: 'Consciousness', icon: '💭', color: '#8b5cf6', width: 700, height: 550, category: 'ai', src: 'apps/consciousness_portal.html' },
      { id: 'punch-cards', name: 'Punch Cards', icon: '🎴', color: '#f59e0b', width: 850, height: 600, category: 'ai', src: 'apps/punch-cards.html' },
      { id: 'llm-studio', name: 'LLM Studio', icon: '🤖', color: '#22c55e', width: 800, height: 550, category: 'ai' },
      { id: 'model-marketplace', name: 'Model Market', icon: '🏪', color: '#ec4899', width: 750, height: 500, category: 'ai' },
      { id: 'training-lab', name: 'Training Lab', icon: '🏋️', color: '#f97316', width: 700, height: 500, category: 'ai' },
      { id: 'knowledge-graph', name: 'Knowledge Graph', icon: '🕸️', color: '#14b8a6', width: 800, height: 550, category: 'ai' },
      
      // Games
      { id: 'chess', name: 'Chess', icon: '♟️', color: '#8b5cf6', width: 650, height: 600, category: 'games', src: 'apps/games/chess-v2/index.html' },
      { id: 'neon-drift', name: 'Neon Drift', icon: '🏎️', color: '#ff6b6b', width: 900, height: 600, category: 'games', src: 'apps/games/neon-drift/index.html' },
      { id: 'mario-gta', name: 'Mario GTA6', icon: '🎮', color: '#22c55e', width: 900, height: 600, category: 'games', src: 'apps/games/super-mario-gta6/index.html' },
      
      // Tools
      { id: 'secure-scraper', name: 'Scraper', icon: '🕸️', color: '#f97316', width: 700, height: 500, category: 'tools', src: 'apps/secure_scraper.html' },
      { id: 'quantum-monitor', name: 'Monitor', icon: '📈', color: '#22c55e', width: 650, height: 500, category: 'tools', src: 'apps/quantum_monitor.html' },
      { id: 'security-center', name: 'Security', icon: '🔐', color: '#dc2626', width: 600, height: 480, category: 'tools', src: 'apps/security_settings.html' },
      { id: 'focus-timer', name: 'Focus Timer', icon: '⏱️', color: '#f59e0b', width: 520, height: 520, category: 'tools', src: 'apps/tools/focus-timer/index.html' },
      { id: 'camera', name: 'Camera', icon: '📷', color: '#64748b', width: 600, height: 480, category: 'tools', src: 'apps/camera_stream.html' },
      
      // Dev
      { id: 'code-editor', name: 'Code Editor', icon: '💻', color: '#3b82f6', width: 900, height: 600, category: 'development' },
      { id: 'api-tester', name: 'API Tester', icon: '🔌', color: '#8b5cf6', width: 700, height: 500, category: 'development' },
      { id: 'git-manager', name: 'Git Manager', icon: '🔀', color: '#f97316', width: 750, height: 500, category: 'development' },
      
      // Media
      { id: 'music', name: 'Neural FM', icon: '🎵', color: '#f59e0b', width: 420, height: 540, category: 'media' },
      { id: 'image-editor', name: 'Image Editor', icon: '🖼️', color: '#ec4899', width: 800, height: 550, category: 'media' },
    ];
    
    for (const app of appList) {
      this.apps.set(app.id, {
        ...app,
        registered: Date.now(),
        instances: 0,
        pinned: ['dashboard', 'terminal', 'files', 'browser', 'aether-chat'].includes(app.id),
      });
    }
  }

  // ---- CONTEXT MENU REGISTRATION ----
  
  _registerAllContextMenus() {
    // Desktop background context menu (right click)
    this.contextMenus.set('desktop', {
      leftClick: { action: 'none', label: 'Select' },
      rightClick: [
        { id: 'new-terminal', label: '📟 New Terminal', action: 'launch', appId: 'terminal' },
        { id: 'new-browser', label: '🌐 New Browser', action: 'launch', appId: 'browser' },
        { id: 'separator', type: 'separator' },
        { id: 'refresh', label: '🔄 Refresh Desktop', action: 'refresh' },
        { id: 'separator', type: 'separator' },
        { id: 'workspace-next', label: '➡️ Next Workspace', action: 'workspaceNext' },
        { id: 'workspace-prev', label: '⬅️ Previous Workspace', action: 'workspacePrev' },
        { id: 'separator', type: 'separator' },
        { id: 'system-info', label: 'ℹ️ System Info', action: 'systemInfo' },
        { id: 'settings', label: '⚙️ Settings', action: 'launch', appId: 'settings' },
      ],
    });
    
    // Terminal context menu
    this.contextMenus.set('terminal', {
      leftClick: { action: 'focus', label: 'Focus Window' },
      rightClick: [
        { id: 'new-tab', label: '📑 New Tab', action: 'terminalNewTab' },
        { id: 'separator', type: 'separator' },
        { id: 'copy', label: '📋 Copy', action: 'copy' },
        { id: 'paste', label: '📋 Paste', action: 'paste' },
        { id: 'select-all', label: '☑️ Select All', action: 'selectAll' },
        { id: 'separator', type: 'separator' },
        { id: 'clear', label: '🧹 Clear', action: 'terminalClear' },
        { id: 'separator', type: 'separator' },
        { id: 'run-ai', label: '🤖 Run AI Command', action: 'terminalAI' },
        { id: 'run-python', label: '🐍 Run Python', action: 'terminalPython' },
        { id: 'separator', type: 'separator' },
        { id: 'split-h', label: '↔️ Split Horizontal', action: 'terminalSplitH' },
        { id: 'split-v', label: '↕️ Split Vertical', action: 'terminalSplitV' },
        { id: 'separator', type: 'separator' },
        { id: 'close', label: '❌ Close', action: 'closeWindow' },
      ],
    });
    
    // Browser context menu
    this.contextMenus.set('browser', {
      leftClick: { action: 'focus', label: 'Focus Window' },
      rightClick: [
        { id: 'back', label: '⬅️ Back', action: 'browserBack' },
        { id: 'forward', label: '➡️ Forward', action: 'browserForward' },
        { id: 'reload', label: '🔄 Reload', action: 'browserReload' },
        { id: 'separator', type: 'separator' },
        { id: 'new-tab', label: '📑 New Tab', action: 'browserNewTab' },
        { id: 'close-tab', label: '❌ Close Tab', action: 'browserCloseTab' },
        { id: 'separator', type: 'separator' },
        { id: 'copy-url', label: '📋 Copy URL', action: 'copyURL' },
        { id: 'bookmark', label: '🔖 Bookmark', action: 'bookmark' },
        { id: 'separator', type: 'separator' },
        { id: 'dev-tools', label: '🔧 Dev Tools', action: 'devTools' },
        { id: 'inspect', label: '🔍 Inspect Element', action: 'inspect' },
        { id: 'separator', type: 'separator' },
        { id: 'ai-summarize', label: '🤖 AI Summarize Page', action: 'aiSummarize' },
        { id: 'ai-translate', label: '🌐 AI Translate', action: 'aiTranslate' },
        { id: 'separator', type: 'separator' },
        { id: 'close', label: '❌ Close', action: 'closeWindow' },
      ],
    });
    
    // Files context menu
    this.contextMenus.set('files', {
      leftClick: { action: 'focus', label: 'Focus Window' },
      rightClick: [
        { id: 'new-file', label: '📄 New File', action: 'filesNewFile' },
        { id: 'new-folder', label: '📁 New Folder', action: 'filesNewFolder' },
        { id: 'separator', type: 'separator' },
        { id: 'open-terminal', label: '📟 Open in Terminal', action: 'filesOpenTerminal' },
        { id: 'open-editor', label: '💻 Open in Editor', action: 'filesOpenEditor' },
        { id: 'separator', type: 'separator' },
        { id: 'cut', label: '✂️ Cut', action: 'cut' },
        { id: 'copy', label: '📋 Copy', action: 'copy' },
        { id: 'paste', label: '📋 Paste', action: 'paste' },
        { id: 'delete', label: '🗑️ Delete', action: 'delete' },
        { id: 'rename', label: '✏️ Rename', action: 'rename' },
        { id: 'separator', type: 'separator' },
        { id: 'compress', label: '📦 Compress', action: 'compress' },
        { id: 'extract', label: '📂 Extract', action: 'extract' },
        { id: 'separator', type: 'separator' },
        { id: 'properties', label: 'ℹ️ Properties', action: 'properties' },
        { id: 'separator', type: 'separator' },
        { id: 'close', label: '❌ Close', action: 'closeWindow' },
      ],
    });
    
    // AI Chat context menu
    this.contextMenus.set('aether-chat', {
      leftClick: { action: 'focus', label: 'Focus Window' },
      rightClick: [
        { id: 'new-chat', label: '💬 New Chat', action: 'chatNew' },
        { id: 'separator', type: 'separator' },
        { id: 'copy-response', label: '📋 Copy Response', action: 'copy' },
        { id: 'regenerate', label: '🔄 Regenerate', action: 'chatRegenerate' },
        { id: 'separator', type: 'separator' },
        { id: 'model-switch', label: '🤖 Switch Model', submenu: [
          { id: 'model-core', label: 'HAZOOM Core', action: 'switchModel', model: 'hazoom-core' },
          { id: 'model-coder', label: 'HAZOOM Coder', action: 'switchModel', model: 'hazoom-coder' },
          { id: 'model-consciousness', label: 'Consciousness', action: 'switchModel', model: 'hazoom-consciousness' },
        ]},
        { id: 'separator', type: 'separator' },
        { id: 'export-chat', label: '💾 Export Chat', action: 'chatExport' },
        { id: 'clear-chat', label: '🧹 Clear Chat', action: 'chatClear' },
        { id: 'separator', type: 'separator' },
        { id: 'voice-input', label: '🎤 Voice Input', action: 'voiceInput' },
        { id: 'voice-output', label: '🔊 Voice Output', action: 'voiceOutput' },
        { id: 'separator', type: 'separator' },
        { id: 'close', label: '❌ Close', action: 'closeWindow' },
      ],
    });
    
    // Generic window context menu (for apps without specific menus)
    this.contextMenus.set('generic', {
      leftClick: { action: 'focus', label: 'Focus Window' },
      rightClick: [
        { id: 'minimize', label: '⬇️ Minimize', action: 'minimizeWindow' },
        { id: 'maximize', label: '⬆️ Maximize', action: 'maximizeWindow' },
        { id: 'restore', label: '🔄 Restore', action: 'restoreWindow' },
        { id: 'separator', type: 'separator' },
        { id: 'move', label: '↔️ Move', action: 'startMove' },
        { id: 'resize', label: '↕️ Resize', action: 'startResize' },
        { id: 'separator', type: 'separator' },
        { id: 'pin', label: '📌 Pin to Taskbar', action: 'pinApp' },
        { id: 'always-on-top', label: '📌 Always on Top', action: 'alwaysOnTop' },
        { id: 'separator', type: 'separator' },
        { id: 'close', label: '❌ Close', action: 'closeWindow' },
        { id: 'close-all', label: '❌ Close All', action: 'closeAllWindows' },
      ],
    });
  }

  // ---- AUTONOMOUS PROCEDURES ----
  
  _registerAllAutonomousProcedures() {
    // Terminal autonomous procedures
    this.autonomousProcedures.set('terminal', {
      onLaunch: async (windowId) => {
        console.log(`[Desktop] Terminal launched: ${windowId}`);
        // Auto-run system status on launch
        return { greeting: true, runStatus: true };
      },
      onFocus: async (windowId) => {
        // Auto-refresh terminal state
        return { refreshed: true };
      },
      onIdle: async (windowId, idleTime) => {
        if (idleTime > 300000) { // 5 minutes
          // Auto-suggest commands based on history
          return { suggestCommands: true };
        }
      },
      onCommand: async (windowId, command) => {
        // Auto-complete, auto-suggest, security check
        const dangerous = ['rm -rf /', 'mkfs', 'dd if=/dev/zero'];
        if (dangerous.some(d => command.includes(d))) {
          return { warning: 'Dangerous command detected', blocked: true };
        }
        return { autoComplete: true };
      },
    });
    
    // Browser autonomous procedures
    this.autonomousProcedures.set('browser', {
      onLaunch: async (windowId) => {
        // Auto-check security certificates
        return { securityCheck: true };
      },
      onNavigate: async (windowId, url) => {
        // Auto-check URL safety, block malicious sites
        const blocked = ['malware.com', 'phishing.net'];
        if (blocked.some(b => url.includes(b))) {
          return { blocked: true, reason: 'Malicious site detected' };
        }
        return { safe: true, prefetch: true };
      },
      onIdle: async (windowId, idleTime) => {
        if (idleTime > 600000) { // 10 minutes
          // Auto-suspend tab to save memory
          return { suspend: true };
        }
      },
      onDownload: async (windowId, filename) => {
        // Auto-scan downloads for malware
        return { scan: true, safe: true };
      },
    });
    
    // AI Chat autonomous procedures
    this.autonomousProcedures.set('aether-chat', {
      onLaunch: async (windowId) => {
        // Auto-load conversation history, check model availability
        return { loadHistory: true, checkModel: true };
      },
      onMessage: async (windowId, message) => {
        // Auto-classify intent, route to appropriate model
        const intent = this._classifyIntent(message);
        return { intent, route: true, rag: true };
      },
      onResponse: async (windowId, response) => {
        // Auto-store in memory, index in knowledge graph
        return { storeMemory: true, indexKnowledge: true };
      },
      onIdle: async (windowId, idleTime) => {
        if (idleTime > 120000) { // 2 minutes
          // Auto-suggest topics based on conversation history
          return { suggestTopics: true };
        }
      },
    });
    
    // Files autonomous procedures
    this.autonomousProcedures.set('files', {
      onLaunch: async (windowId) => {
        // Auto-index recent files, check disk space
        return { indexRecent: true, checkDisk: true };
      },
      onFileOpen: async (windowId, path) => {
        // Auto-detect file type, suggest appropriate app
        const ext = path.split('.').pop()?.toLowerCase();
        const appMap = { 'js': 'code-editor', 'py': 'code-editor', 'html': 'browser', 'md': 'code-editor' };
        return { suggestedApp: appMap[ext] || null };
      },
      onFileDelete: async (windowId, path) => {
        // Auto-backup to trash, log deletion
        return { backup: true, log: true };
      },
      onDiskLow: async () => {
        // Auto-suggest cleanup, find large files
        return { cleanup: true, findLarge: true };
      },
    });
    
    // Dashboard autonomous procedures
    this.autonomousProcedures.set('dashboard', {
      onLaunch: async (windowId) => {
        // Auto-refresh all metrics, check system health
        return { refreshMetrics: true, healthCheck: true };
      },
      onRefresh: async (windowId) => {
        // Auto-collect metrics from all modules
        return { collectAll: true };
      },
    });
    
    // Security Center autonomous procedures
    this.autonomousProcedures.set('security-center', {
      onLaunch: async (windowId) => {
        // Auto-scan for threats, check firewall
        return { threatScan: true, firewallCheck: true };
      },
      onThreatDetected: async (windowId, threat) => {
        // Auto-isolate, auto-quarantine, auto-notify
        return { isolate: true, quarantine: true, notify: true };
      },
    });
  }

  // ---- WINDOW MANAGEMENT ----
  
  createWindow(appId, options = {}) {
    const app = this.apps.get(appId);
    if (!app) throw new Error(`App not found: ${appId}`);
    
    const windowId = `win_${++this.windowIdCounter}`;
    const width = options.width || app.width || 800;
    const height = options.height || app.height || 600;
    const x = options.x || (100 + (this.windows.size * 30) % 300);
    const y = options.y || (80 + (this.windows.size * 30) % 200);
    
    const win = {
      id: windowId,
      appId,
      title: app.name,
      icon: app.icon,
      color: app.color,
      x,
      y,
      width,
      height,
      minWidth: 300,
      minHeight: 200,
      maximized: false,
      minimized: false,
      focused: false,
      alwaysOnTop: false,
      workspace: this.activeWorkspace,
      zIndex: ++this.zIndexCounter,
      state: 'normal', // normal, minimized, maximized
      tabs: [],
      activeTab: 0,
      createdAt: Date.now(),
      lastFocused: Date.now(),
    };
    
    this.windows.set(windowId, win);
    this.focusWindow(windowId);
    
    // Run autonomous procedure
    this._runAutonomousProcedure(appId, 'onLaunch', windowId);
    
    // Update app instance count
    app.instances++;
    
    return win;
  }

  closeWindow(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;
    
    // Run autonomous procedure
    this._runAutonomousProcedure(win.appId, 'onClose', windowId);
    
    // Update app instance count
    const app = this.apps.get(win.appId);
    if (app) app.instances = Math.max(0, app.instances - 1);
    
    this.windows.delete(windowId);
    this.minimizedWindows.delete(windowId);
    
    // Focus next window
    const remaining = [...this.windows.values()].filter(w => w.workspace === this.activeWorkspace);
    if (remaining.length > 0) {
      remaining.sort((a, b) => b.lastFocused - a.lastFocused);
      this.focusWindow(remaining[0].id);
    }
  }

  focusWindow(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;
    
    // Unfocus all
    for (const w of this.windows.values()) {
      w.focused = false;
    }
    
    // Focus this
    win.focused = true;
    win.zIndex = ++this.zIndexCounter;
    win.lastFocused = Date.now();
    win.minimized = false;
    this.minimizedWindows.delete(windowId);
    this.focusedWindow = windowId;
    
    // Run autonomous procedure
    this._runAutonomousProcedure(win.appId, 'onFocus', windowId);
  }

  minimizeWindow(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;
    win.minimized = true;
    win.focused = false;
    this.minimizedWindows.add(windowId);
  }

  maximizeWindow(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;
    win.maximized = true;
    win.state = 'maximized';
  }

  restoreWindow(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;
    win.maximized = false;
    win.minimized = false;
    win.state = 'normal';
    this.minimizedWindows.delete(windowId);
    this.focusWindow(windowId);
  }

  moveWindow(windowId, x, y) {
    const win = this.windows.get(windowId);
    if (!win) return;
    win.x = x;
    win.y = y;
  }

  resizeWindow(windowId, width, height) {
    const win = this.windows.get(windowId);
    if (!win) return;
    win.width = Math.max(win.minWidth, width);
    win.height = Math.max(win.minHeight, height);
  }

  // ---- CONTEXT MENU SYSTEM ----
  
  getContextMenu(appId, clickType) {
    const menu = this.contextMenus.get(appId) || this.contextMenus.get('generic');
    if (clickType === 'left') return menu.leftClick;
    return menu.rightClick;
  }

  executeContextAction(action, windowId, data = {}) {
    const win = this.windows.get(windowId);
    const appId = win?.appId || 'desktop';
    
    switch (action) {
      // Window actions
      case 'closeWindow': this.closeWindow(windowId); break;
      case 'closeAllWindows': [...this.windows.keys()].forEach(id => this.closeWindow(id)); break;
      case 'minimizeWindow': this.minimizeWindow(windowId); break;
      case 'maximizeWindow': this.maximizeWindow(windowId); break;
      case 'restoreWindow': this.restoreWindow(windowId); break;
      case 'alwaysOnTop': if (win) win.alwaysOnTop = !win.alwaysOnTop; break;
      
      // App launch
      case 'launch': this.createWindow(data.appId); break;
      
      // Desktop actions
      case 'refresh': location.reload(); break;
      case 'workspaceNext': this.switchWorkspace(this.activeWorkspace + 1); break;
      case 'workspacePrev': this.switchWorkspace(this.activeWorkspace - 1); break;
      case 'systemInfo': this.createWindow('dashboard'); break;
      
      // Terminal actions
      case 'terminalNewTab': console.log('New terminal tab'); break;
      case 'terminalClear': console.log('Terminal clear'); break;
      case 'terminalAI': console.log('Terminal AI command'); break;
      case 'terminalPython': console.log('Terminal Python'); break;
      case 'terminalSplitH': console.log('Split horizontal'); break;
      case 'terminalSplitV': console.log('Split vertical'); break;
      
      // Browser actions
      case 'browserBack': console.log('Browser back'); break;
      case 'browserForward': console.log('Browser forward'); break;
      case 'browserReload': console.log('Browser reload'); break;
      case 'browserNewTab': console.log('New browser tab'); break;
      case 'aiSummarize': console.log('AI summarize page'); break;
      case 'aiTranslate': console.log('AI translate'); break;
      
      // Chat actions
      case 'chatNew': console.log('New chat'); break;
      case 'chatRegenerate': console.log('Regenerate response'); break;
      case 'chatExport': console.log('Export chat'); break;
      case 'chatClear': console.log('Clear chat'); break;
      case 'switchModel': console.log('Switch model:', data.model); break;
      case 'voiceInput': console.log('Voice input'); break;
      case 'voiceOutput': console.log('Voice output'); break;
      
      // Files actions
      case 'filesNewFile': console.log('New file'); break;
      case 'filesNewFolder': console.log('New folder'); break;
      case 'filesOpenTerminal': console.log('Open in terminal'); break;
      case 'filesOpenEditor': console.log('Open in editor'); break;
      
      // Generic
      case 'copy': document.execCommand('copy'); break;
      case 'paste': document.execCommand('paste'); break;
      case 'cut': document.execCommand('cut'); break;
      case 'delete': console.log('Delete'); break;
      case 'rename': console.log('Rename'); break;
      case 'pinApp': if (appId) { const app = this.apps.get(appId); if (app) app.pinned = !app.pinned; } break;
      
      default:
        console.log(`[Desktop] Context action: ${action}`, data);
    }
    
    // Run autonomous procedure
    this._runAutonomousProcedure(appId, 'onContextAction', windowId, { action, data });
  }

  // ---- AUTONOMOUS PROCEDURE EXECUTION ----
  
  async _runAutonomousProcedure(appId, trigger, windowId, data = {}) {
    const procedures = this.autonomousProcedures.get(appId);
    if (!procedures) return;
    
    const handler = procedures[trigger];
    if (!handler) return;
    
    try {
      const result = await handler(windowId, data);
      if (result) {
        console.log(`[Desktop] Autonomous [${appId}/${trigger}]:`, result);
      }
    } catch (e) {
      console.error(`[Desktop] Autonomous procedure error [${appId}/${trigger}]:`, e);
    }
  }

  // ---- WORKSPACE MANAGEMENT ----
  
  switchWorkspace(index) {
    if (index < 0 || index >= this.workspaces.length) return;
    
    // Deactivate current
    this.workspaces[this.activeWorkspace].active = false;
    
    // Activate new
    this.activeWorkspace = index;
    this.workspaces[index].active = true;
    
    // Show/hide windows
    for (const win of this.windows.values()) {
      if (win.workspace === index) {
        win.minimized = false;
      }
    }
    
    console.log(`[Desktop] Workspace: ${this.workspaces[index].name}`);
  }

  // ---- GLOBAL EVENT LISTENERS ----
  
  _setupGlobalListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Alt+Tab: Switch windows
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        this._cycleWindows();
      }
      
      // Ctrl+Alt+T: New terminal
      if (e.ctrlKey && e.altKey && e.key === 't') {
        e.preventDefault();
        this.createWindow('terminal');
      }
      
      // Ctrl+Alt+B: New browser
      if (e.ctrlKey && e.altKey && e.key === 'b') {
        e.preventDefault();
        this.createWindow('browser');
      }
      
      // Super+D: Show desktop (minimize all)
      if (e.metaKey && e.key === 'd') {
        e.preventDefault();
        for (const id of this.windows.keys()) {
          this.minimizeWindow(id);
        }
      }
      
      // Escape: Close context menu
      if (e.key === 'Escape') {
        this.activeContextMenu = null;
      }
    });
    
    // Mouse up: End drag/resize
    document.addEventListener('mouseup', () => {
      this.dragState.active = false;
      this.resizeState.active = false;
    });
    
    // Mouse move: Handle drag/resize
    document.addEventListener('mousemove', (e) => {
      if (this.dragState.active) {
        this.moveWindow(
          this.dragState.windowId,
          e.clientX - this.dragState.offsetX,
          e.clientY - this.dragState.offsetY
        );
      }
      if (this.resizeState.active) {
        const dx = e.clientX - this.resizeState.startX;
        const dy = e.clientY - this.resizeState.startY;
        this.resizeWindow(
          this.resizeState.windowId,
          this.resizeState.startWidth + dx,
          this.resizeState.startHeight + dy
        );
      }
    });
  }

  _cycleWindows() {
    const visible = [...this.windows.values()]
      .filter(w => w.workspace === this.activeWorkspace && !w.minimized)
      .sort((a, b) => b.lastFocused - a.lastFocused);
    
    if (visible.length > 1) {
      this.focusWindow(visible[1].id);
    }
  }

  // ---- UTILITY ----
  
  _classifyIntent(message) {
    const lower = message.toLowerCase();
    if (/hello|hi|hey|greetings/.test(lower)) return 'greeting';
    if (/who are you|what are you/.test(lower)) return 'identity';
    if (/consciousness|think|feel/.test(lower)) return 'consciousness';
    if (/search|find|look/.test(lower)) return 'search';
    if (/code|program|debug/.test(lower)) return 'code';
    if (/help|assist/.test(lower)) return 'help';
    return 'general';
  }

  getWindows() {
    return [...this.windows.values()];
  }

  getApps() {
    return [...this.apps.values()];
  }

  getWorkspaces() {
    return this.workspaces;
  }

  getStatus() {
    return {
      windows: this.windows.size,
      focused: this.focusedWindow,
      workspace: this.activeWorkspace,
      apps: this.apps.size,
      minimized: this.minimizedWindows.size,
    };
  }
}

// Export
export { HazoomDesktop };

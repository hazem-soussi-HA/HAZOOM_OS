// ============================================
// HAZOOM OS - DEBUG MODE
// ============================================

const DebugMode = {
    enabled: true,

    log: function(message, data = null) {
        if (!this.enabled) return;
        console.log(`[HAZOOM DEBUG] ${message}`, data || '');
    },

    checkDOM: function() {
        this.log('Checking DOM elements...');
        const elements = [
            'os-container',
            'desktop',
            'desktop-icons',
            'windows-container',
            'taskbar',
            'start-menu',
            'start-apps',
            'start-btn'
        ];

        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                this.log(`✅ ${id} found`, {
                    visible: el.style.display !== 'none',
                    opacity: el.style.opacity,
                    children: el.children.length
                });
            } else {
                this.log(`❌ ${id} NOT FOUND`);
            }
        });
    },

    checkDesktopIcons: function() {
        const cont = document.getElementById('desktop-icons');
        if (!cont) {
            this.log('❌ desktop-icons container not found');
            return;
        }
        this.log(`Desktop icons count: ${cont.children.length}`);
        Array.from(cont.children).forEach((icon, idx) => {
            this.log(`Icon ${idx}:`, icon.textContent.trim());
        });
    },

    checkApps: function() {
        if (typeof apps !== 'undefined' && apps.desktopApps) {
            this.log(`Apps defined: ${apps.desktopApps.length}`, apps.desktopApps);
        } else {
            this.log('❌ Apps object not defined or empty');
        }
    },

    checkHAZOOM: function() {
        if (typeof HAZOOM !== 'undefined') {
            this.log('✅ HAZOOM object defined', Object.keys(HAZOOM));
        } else {
            this.log('❌ HAZOOM object not defined');
        }
    },

    checkWindowManager: function() {
        if (typeof WindowManager !== 'undefined') {
            this.log('✅ WindowManager defined');
            this.log(`Windows count: ${WindowManager.windows.length}`);
        } else {
            this.log('❌ WindowManager not defined');
        }
    },

    runFullDiagnostic: function() {
        this.log('=== FULL SYSTEM DIAGNOSTIC ===');
        this.checkDOM();
        this.checkApps();
        this.checkHAZOOM();
        this.checkWindowManager();
        this.checkDesktopIcons();
        this.log('=== END DIAGNOSTIC ===');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => DebugMode.runFullDiagnostic(), 2000);

    // Automated registration smoke-test (enabled by setting window.__hazoom_auto_test = true before load)
    if (window.__hazoom_auto_test) {
        setTimeout(() => {
            DebugMode.runAutomatedAppRegistrationTest();
        }, 2500);
    }
});

// --- Automated tests ---
DebugMode.runAutomatedAppRegistrationTest = async function() {
    console.log('[HAZOOM DEBUG] Starting automated app registration test');

    if (typeof HAZOOM === 'undefined' || typeof HAZOOM.registerApp !== 'function') {
        console.error('[HAZOOM DEBUG] ❌ HAZOOM.registerApp not available');
        return false;
    }

    // Use a unique id to avoid collisions
    const testId = 'autotest_sample_' + Date.now();
    HAZOOM.registerApp(testId, {
        name: 'Auto Test App',
        icon: '🧪',
        getContent: async () => `<div style="padding:20px;">Automated Test Content</div>`
    });

    // Allow the UI a short moment to update
    await new Promise(r => setTimeout(r, 200));
    try {
        initDesktop();
        initStartMenu();
    } catch (e) {
        console.warn('[HAZOOM DEBUG] refresh init failed:', e);
    }

    const desktop = document.getElementById('desktop-icons');
    const start = document.getElementById('start-apps');
    const desktopFound = desktop ? Array.from(desktop.children).some(el => el.textContent.includes('Auto Test App')) : false;
    const startFound = start ? Array.from(start.children).some(el => el.textContent.includes('Auto Test App')) : false;

    // Also attempt to open the app via HAZOOM.openApp (which prefers AppLauncher when present)
    let openedWindowId = null;
    try {
        openedWindowId = HAZOOM.openApp(testId);
    } catch (e) {
        console.error('[HAZOOM DEBUG] ❌ Error opening test app:', e);
    }

    // Allow small delay for window create
    await new Promise(r => setTimeout(r, 300));
    const windowEl = openedWindowId ? document.getElementById(openedWindowId) : document.querySelector(".window[data-app-id='" + testId + "']") || document.querySelector(".window[data-app-id='" + testId + "']");
    const windowFound = !!windowEl;

    if (desktopFound && startFound && windowFound) {
        console.log('[HAZOOM DEBUG] ✅ Automated registration + launch test PASSED');
        return true;
    } else {
        console.error('[HAZOOM DEBUG] ❌ Automated registration + launch test FAILED', {desktopFound, startFound, windowFound});
        return false;
    }
};

// ============================================
// HAZOOM OS - SECURE APP LAUNCHER
// ============================================

// Support queueing app registrations from services that run before core.js is loaded.
if (typeof window !== 'undefined' && !window.__hazoom_register_queue) {
    window.__hazoom_register_queue = [];
    // Global helper to register apps early. If HAZOOM isn't ready yet, pushes to queue.
    window.registerApp = function (id, app) {
        if (window.HAZOOM && typeof window.HAZOOM.registerApp === 'function') {
            window.HAZOOM.registerApp(id, app);
        } else {
            window.__hazoom_register_queue.push({ id, app });
        }
    };
}

const SecureAppLauncher = {
    state: {
        runningApps: [],
        sandboxedApps: {},
        appPermissions: {}
    },

    launch: async function (appId, config = {}) {
        console.log(`🚀 Launching app: ${appId}`);

        const permissionGranted = PrivacyController.checkAppLaunch(appId);
        if (!permissionGranted) {
            console.error(`App launch denied: ${appId}`);
            return false;
        }

        const app = this.getAppConfig(appId);
        if (!app) {
            console.error(`App not found: ${appId}`);
            return false;
        }

        // Handle apps with a custom launch function
        if (typeof app.launch === 'function') {
            app.launch(config);
            return;
        }

        const sandboxId = `sandbox_${Date.now()}`;

        if (app.requiresSandbox) {
            this.createSandbox(sandboxId, appId, config);
        }

        const windowConfig = {
            appId: appId,
            title: app.title,
            content: app.content,
            width: config.width || app.defaultWidth || 800,
            height: config.height || app.defaultHeight || 600,
            x: config.x || null,
            y: config.y || null
        };

        const windowId = HAZOOM.WindowManager.create(windowConfig);

        this.state.runningApps.push({
            appId: appId,
            windowId: windowId,
            sandboxId: sandboxId,
            launchedAt: Date.now(),
            config: config
        });

        PrivacyController.audit('app_launched', {
            appId: appId,
            windowId: windowId,
            sandboxId: sandboxId,
            config: config
        });

        console.log(`✅ App launched: ${appId}`);
        return windowId;
    },

    getAppConfig: function (appId) {
        // Internal embedded map for default system apps
        const embeddedConfigs = {
            'quantum_search': {
                title: 'Quantum Search',
                content: this.loadAppContent('quantum_search'),
                defaultWidth: 700,
                defaultHeight: 500,
                requiresSandbox: false,
                permissions: ['system'],
                category: 'system'
            },
            'antigravity_navigator': {
                title: 'Antigravity Navigator',
                content: this.loadAppContent('antigravity_navigator'),
                defaultWidth: 1000,
                defaultHeight: 700,
                requiresSandbox: false,
                permissions: ['system', 'network'],
                category: 'system'
            },
            'hazoom': {
                title: 'Hazoom AI',
                content: this.loadAppContent('hazoom_integration'),
                defaultWidth: 1000,
                defaultHeight: 700,
                requiresSandbox: true,
                permissions: ['network', 'file_read'],
                category: 'ai'
            },
            'super_intelligent_agent': {
                title: 'Super Intelligent Agent',
                content: this.loadAppContent('super_intelligent_agent'),
                defaultWidth: 1400,
                defaultHeight: 900,
                requiresSandbox: true,
                permissions: ['network'],
                category: 'quantum'
            },
            'copilot': {
                title: 'Hazem Co-Pilot',
                content: this.loadAppContent('copilot'),
                defaultWidth: 900,
                defaultHeight: 600,
                requiresSandbox: true,
                permissions: ['network'],
                category: 'ai'
            },
            'secure_scraper': {
                title: 'Secure Scraper',
                content: this.loadAppContent('secure_scraper'),
                defaultWidth: 900,
                defaultHeight: 600,
                requiresSandbox: true,
                permissions: ['network', 'file_write'],
                category: 'tools'
            },
            'filemanager': {
                title: 'File Manager',
                content: this.loadAppContent('filemanager'),
                defaultWidth: 800,
                defaultHeight: 600,
                requiresSandbox: true,
                permissions: ['file_read', 'file_write'],
                category: 'system'
            },
            'terminal': {
                title: 'Terminal',
                content: this.loadAppContent('terminal'),
                defaultWidth: 700,
                defaultHeight: 500,
                requiresSandbox: false,
                permissions: ['system'],
                category: 'system'
            },
            'quantum_monitor': {
                title: 'Quantum Monitor',
                content: this.loadAppContent('quantum_monitor'),
                defaultWidth: 900,
                defaultHeight: 600,
                requiresSandbox: false,
                permissions: ['system'],
                category: 'quantum'
            },
            'consciousness_portal': {
                title: 'Consciousness Portal',
                content: this.loadAppContent('consciousness_portal'),
                defaultWidth: 900,
                defaultHeight: 600,
                requiresSandbox: false,
                permissions: [],
                category: 'quantum'
            },
            'settings': {
                title: 'Settings',
                content: this.loadAppContent('settings'),
                defaultWidth: 700,
                defaultHeight: 500,
                requiresSandbox: false,
                permissions: ['system'],
                category: 'system'
            },
            'background_office': {
                title: 'Background Office',
                content: this.loadAppContent('background_office'),
                defaultWidth: 1300,
                defaultHeight: 850,
                requiresSandbox: false,
                permissions: ['system'],
                category: 'system'
            },
            'camera_stream': {
                title: 'Camera Stream',
                content: this.loadAppContent('camera_stream'),
                defaultWidth: 900,
                defaultHeight: 600,
                requiresSandbox: true,
                permissions: ['network', 'media'],
                category: 'tools'
            },
            'deep_think_explorer': {
                title: 'Symphony Deep Think',
                content: this.loadAppContent('deep_think_explorer'),
                defaultWidth: 1000,
                defaultHeight: 800,
                requiresSandbox: true,
                permissions: ['system'],
                category: 'ai'
            }
        };

        // If no appId, return all combined
        if (typeof appId === 'undefined' || appId === null) {
            const registryApps = (window.AppRegistry) ? window.AppRegistry.getAppList() : [];
            const combinedMap = { ...embeddedConfigs };

            registryApps.forEach(id => {
                const regCfg = window.AppRegistry.getConfig(id);
                if (regCfg) {
                    combinedMap[id] = regCfg;
                } else if (!combinedMap[id]) {
                    const meta = window.AppRegistry.getMeta(id);
                    combinedMap[id] = {
                        title: meta?.name || id,
                        content: this.loadAppContent(id),
                        defaultWidth: 800,
                        defaultHeight: 600,
                        requiresSandbox: false,
                        permissions: [],
                        category: 'system'
                    };
                }
            });
            return combinedMap;
        }

        // Single App lookup logic
        // 1. Check Registry for full config
        if (window.AppRegistry) {
            const regCfg = window.AppRegistry.getConfig(appId);
            if (regCfg) return regCfg;
        }

        // 2. Check Embedded map
        if (embeddedConfigs[appId]) return embeddedConfigs[appId];

        // 3. Last fallback: Check Registry for meta-only apps
        if (window.AppRegistry) {
            const meta = window.AppRegistry.getMeta(appId);
            if (meta) {
                return {
                    title: meta.name,
                    content: this.loadAppContent(appId),
                    defaultWidth: 800,
                    defaultHeight: 600,
                    requiresSandbox: false,
                    permissions: [],
                    category: 'system'
                };
            }
        }

        return null;
    },

    loadAppContent: function (appId) {
        return `apps/${appId}.html`;
    },

    createSandbox: function (sandboxId, appId, sandboxConfig) {
        const sandbox = {
            id: sandboxId,
            appId: appId,
            created: Date.now(),
            fileSystem: this.createVirtualFS(appId),
            networkRules: this.getNetworkRules(appId),
            ipcChannels: this.getIPCChannels(appId),
            permissions: this.getAppPermissions(appId),
            sandboxConfig: sandboxConfig
        };

        this.state.sandboxedApps[sandboxId] = sandbox;

        PrivacyController.audit('sandbox_created', {
            sandboxId: sandboxId,
            appId: appId
        });

        console.log(`🔒 Sandbox created: ${sandboxId} for ${appId}`);
        return sandbox;
    },

    createVirtualFS: function (appId) {
        return {
            root: `/Hazoom_OS/Apps/${appId}`,
            allowedOperations: ['read', 'write'],
            quota: 10 * 1024 * 1024, // 10MB
            encrypted: true
        };
    },

    getNetworkRules: function (appId) {
        const rules = {
            'hazoom': {
                whitelist: ['api.hazoom.ai', 'localhost:8000', '127.0.0.1:8000'],
                blacklist: ['*'],
                maxRequestsPerMinute: 60
            },
            'copilot': {
                whitelist: ['api.openai.com', 'localhost:8000', '127.0.0.1:8000'],
                blacklist: ['*'],
                maxRequestsPerMinute: 30
            },
            'secure_scraper': {
                whitelist: ['*'],
                blacklist: [],
                maxRequestsPerMinute: 120,
                requiresUserConsent: true
            }
        };

        return rules[appId] || { whitelist: [], blacklist: ['*'] };
    },

    getIPCChannels: function (appId) {
        return {
            allowedChannels: [`app_${appId}`],
            systemAccess: false,
            crossAppCommunication: false
        };
    },

    getAppPermissions: function (appId) {
        const perms = {
            'hazoom': ['network_read', 'file_read', 'storage'],
            'copilot': ['network_read', 'storage'],
            'secure_scraper': ['network_read', 'network_write', 'file_write', 'storage'],
            'filemanager': ['file_read', 'file_write', 'storage'],
            'terminal': ['system_execute', 'file_read', 'file_write'],
            'quantum_monitor': ['system_read'],
            'consciousness_portal': [],
            'settings': ['system_read', 'system_write', 'storage'],
            'background_office': ['system_read', 'storage'],
            'usb_portal': ['system_read', 'system_write', 'file_read', 'file_write', 'storage', 'hardware_access']
        };

        return perms[appId] || [];
    },

    terminate: function (windowId) {
        const appIndex = this.state.runningApps.findIndex(a => a.windowId === windowId);
        if (appIndex === -1) return false;

        const app = this.state.runningApps[appIndex];

        if (app.sandboxId && this.state.sandboxedApps[app.sandboxId]) {
            this.destroySandbox(app.sandboxId);
        }

        this.state.runningApps.splice(appIndex, 1);

        PrivacyController.audit('app_terminated', {
            appId: app.appId,
            windowId: windowId,
            sandboxId: app.sandboxId
        });

        console.log(`⏹️ App terminated: ${app.appId}`);
        return true;
    },

    destroySandbox: function (sandboxId) {
        const sandbox = this.state.sandboxedApps[sandboxId];
        if (!sandbox) return;

        PrivacyController.audit('sandbox_destroyed', {
            sandboxId: sandboxId,
            appId: sandbox.appId
        });

        delete this.state.sandboxedApps[sandboxId];
        console.log(`🔓 Sandbox destroyed: ${sandboxId}`);
    },

    getAppList: function () {
        try {
            return Object.keys(this.getAppConfig());
        } catch (e) {
            console.warn('getAppList failed:', e);
            return [];
        }
    },

    getRunningApps: function () {
        return this.state.runningApps.map(app => ({
            appId: app.appId,
            windowId: app.windowId,
            sandboxId: app.sandboxId,
            uptime: Date.now() - app.launchedAt
        }));
    },

    requestPermission: function (appId, permission, details = {}) {
        const granted = confirm(
            `🔐 App Permission Request\n\n` +
            `App: ${appId}\n` +
            `Permission: ${permission}\n` +
            `Details: ${JSON.stringify(details)}\n\n` +
            `Grant this permission?`
        );

        if (granted) {
            if (!this.state.appPermissions[appId]) {
                this.state.appPermissions[appId] = [];
            }
            this.state.appPermissions[appId].push({
                permission: permission,
                granted: granted,
                timestamp: Date.now(),
                details: details
            });

            PrivacyController.audit('permission_granted', {
                appId: appId,
                permission: permission,
                details: details
            });
        } else {
            PrivacyController.audit('permission_denied', {
                appId: appId,
                permission: permission,
                details: details
            });
        }

        return granted;
    },

    getSandboxInfo: function (sandboxId) {
        return this.state.sandboxedApps[sandboxId] || null;
    }
};

if (typeof HAZOOM !== 'undefined') {
    HAZOOM.AppLauncher = SecureAppLauncher;
} else if (typeof window !== 'undefined') {
    // Attach the launcher after HAZOOM is initialized (script load order may vary)
    window.addEventListener('DOMContentLoaded', () => {
        if (window.HAZOOM) window.HAZOOM.AppLauncher = SecureAppLauncher;
    });
}
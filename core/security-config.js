/*
 * HAZOOM OS Security Configuration
 * Secure Mode: Enhanced security with restricted access and monitoring
 */

const SecurityConfig = {
    // Secure Mode Status
    secureMode: false, // Changed from true to false for better accessibility

    // Security Levels
    levels: {
        BASIC: 'basic',
        STANDARD: 'standard',
        SECURE: 'secure',
        LOCKDOWN: 'lockdown'
    },

    // Current Security Level
    currentLevel: 'standard', // Changed from 'secure' to 'standard'

    // App Permissions in Secure Mode
    securePermissions: {
        'super_intelligent_agent': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'strict',
            allowedEndpoints: [
                '/agents',
                '/metrics',
                '/health',
                '/quantum'
            ],
            networkRestrictions: ['localhost', '127.0.0.1']
        },
        'hazoom': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'quantum_monitor': {
            allowed: true,
            requiresAuth: false,
            sandboxLevel: 'minimal'
        },
        'copilot': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'strict',
            apiKeysRequired: true
        },
        'ai_assistant': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'filemanager': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'restricted',
            fileAccess: 'sandboxed'
        },
        'terminal': {
            allowed: true, // Enabled in secure mode with restrictions
            requiresAuth: true,
            sandboxLevel: 'restricted'
        },
        'settings': {
            allowed: true,
            requiresAuth: false,
            sandboxLevel: 'minimal'
        },
        'browser': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'admin_monitor': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'api_settings': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'restricted'
        },
        'camera_stream': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'pricing': {
            allowed: true,
            requiresAuth: false,
            sandboxLevel: 'minimal'
        },
        'secure_scraper': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'strict'
        },
        'security_settings': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'chess': {
            allowed: true,
            requiresAuth: false,
            sandboxLevel: 'minimal'
        },
        'background_office': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'quantum_travel': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'hazoom_integration': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'consciousness_portal': {
            allowed: true,
            requiresAuth: false,
            sandboxLevel: 'minimal'
        },
        'quantum-heat-monitor': {
            allowed: true,
            requiresAuth: false,
            sandboxLevel: 'minimal'
        },
        'hazoom_search': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'advanced_navigator': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'hazoom_ai_assistant': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'hazoom_search_indexer': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'restricted'
        },
        'hazoom_universal_search': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'antigravity_navigator': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        },
        'usb_portal': {
            allowed: true,
            requiresAuth: true,
            sandboxLevel: 'secure'
        }
    },

    // Secure Mode Features
    features: {
        encryptedConnections: true,
        sessionTimeout: 1800, // 30 minutes
        auditLogging: true,
        intrusionDetection: true,
        rateLimiting: true,
        contentFiltering: true
    },

    // Toggle Secure Mode
    enableSecureMode: function() {
        this.secureMode = true;
        this.currentLevel = this.levels.SECURE;
        this.saveConfig();
        this.notifyUsers('SECURE MODE ENABLED');
        this.applySecureRestrictions();
    },

    disableSecureMode: function() {
        this.secureMode = false;
        this.currentLevel = this.levels.STANDARD;
        this.saveConfig();
        this.notifyUsers('SECURE MODE DISABLED');
        this.removeSecureRestrictions();
    },

    // Save Configuration
    saveConfig: function() {
        localStorage.setItem('hazoom_security_config', JSON.stringify({
            secureMode: this.secureMode,
            currentLevel: this.currentLevel,
            timestamp: new Date().toISOString()
        }));
    },

    // Load Configuration
    loadConfig: function() {
        const saved = localStorage.getItem('hazoom_security_config');
        if (saved) {
            const config = JSON.parse(saved);
            this.secureMode = config.secureMode || false;
            this.currentLevel = config.currentLevel || this.levels.STANDARD;
        }
    },

    // Check App Permission
    checkAppPermission: function(appId) {
        const perm = this.securePermissions[appId];
        if (!perm) return false;

        if (this.secureMode && !perm.allowed) {
            return {
                allowed: false,
                reason: 'App not allowed in secure mode',
                requiresLevel: this.levels.STANDARD
            };
        }

        return {
            allowed: true,
            requiresAuth: perm.requiresAuth,
            sandboxLevel: perm.sandboxLevel
        };
    },

    // Apply Secure Restrictions
    applySecureRestrictions: function() {
        // Add secure class to body
        document.body.classList.add('secure-mode');

        // Disable restricted apps
        Object.entries(this.securePermissions).forEach(([appId, perm]) => {
            if (!perm.allowed && this.secureMode) {
                const appElements = document.querySelectorAll(`[data-app-id="${appId}"]`);
                appElements.forEach(el => {
                    el.classList.add('secure-restricted');
                    el.style.opacity = '0.5';
                    el.style.pointerEvents = 'none';
                });
            }
        });

        // Show security indicator
        this.showSecurityIndicator();
    },

    // Remove Secure Restrictions
    removeSecureRestrictions: function() {
        document.body.classList.remove('secure-mode');

        Object.keys(this.securePermissions).forEach(appId => {
            const appElements = document.querySelectorAll(`[data-app-id="${appId}"]`);
            appElements.forEach(el => {
                el.classList.remove('secure-restricted');
                el.style.opacity = '';
                el.style.pointerEvents = '';
            });
        });

        this.hideSecurityIndicator();
    },

    // Show Security Indicator
    showSecurityIndicator: function() {
        let indicator = document.getElementById('security-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'security-indicator';
            indicator.innerHTML = `
                <div class="security-badge">???? SECURE MODE</div>
            `;
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
    },

    // Hide Security Indicator
    hideSecurityIndicator: function() {
        const indicator = document.getElementById('security-indicator');
        if (indicator) {
            indicator.remove();
        }
    },

    // Notify Users
    notifyUsers: function(message) {
        const notification = document.createElement('div');
        notification.className = 'security-notification';
        notification.innerHTML = `
            <div class="notification-icon">????</div>
            <div class="notification-text">${message}</div>
        `;
        notification.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            padding: 15px 20px;
            border-radius: 10px;
            display: flex;
            gap: 10px;
            align-items: center;
            z-index: 9999;
            animation: slideUp 0.3s ease;
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Audit Log
    auditLog: function(action, details) {
        if (!this.features.auditLogging) return;

        const log = {
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            secureMode: this.secureMode,
            securityLevel: this.currentLevel
        };

        let logs = JSON.parse(localStorage.getItem('hazoom_audit_log') || '[]');
        logs.push(log);

        // Keep last 1000 logs
        if (logs.length > 1000) logs = logs.shift();

        localStorage.setItem('hazoom_audit_log', JSON.stringify(logs));
    },

    // Get Audit Logs
    getAuditLogs: function(limit = 100) {
        const logs = JSON.parse(localStorage.getItem('hazoom_audit_log') || '[]');
        return logs.slice(-limit);
    }
};

// Load configuration on page load
SecurityConfig.loadConfig();

// Add styles for secure mode
const secureStyles = `
<style>
    .secure-mode {
        --security-border: 2px solid #667eea;
    }

    .security-badge {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .secure-restricted {
        position: relative;
    }

    .secure-restricted::after {
        content: '????';
        position: absolute;
        top: 5px;
        right: 5px;
        font-size: 16px;
        background: rgba(102, 126, 234, 0.9);
        width: 25px;
        height: 25px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
    }

    .security-notification {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            transform: translateY(50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
</style>
`;

document.head.insertAdjacentHTML('beforeend', secureStyles);

// Export SecurityConfig to window
if (typeof window !== 'undefined') {
    window.SecurityConfig = SecurityConfig;
}

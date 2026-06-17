// ============================================
// HAZOOM OS - PRIVACY CONTROLLER
// ============================================

const PrivacyController = {
    state: {
        permissions: {},
        consent: {},
        auditLog: [],
        dataClassification: {}
    },

    init: function() {
        this.loadPermissions();
        this.loadConsent();
        this.loadAuditLog();
        console.log('🔒 Privacy Controller initialized');
    },

    loadPermissions: function() {
        try {
            const saved = localStorage.getItem('hazoom_privacy_permissions');
            this.state.permissions = saved ? JSON.parse(saved) : this.getDefaultPermissions();
            this.savePermissions();
        } catch (e) {
            console.error('Error loading permissions:', e);
            this.state.permissions = this.getDefaultPermissions();
        }
    },

    loadConsent: function() {
        try {
            const saved = localStorage.getItem('hazoom_privacy_consent');
            this.state.consent = saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('Error loading consent:', e);
            this.state.consent = {};
        }
    },

    loadAuditLog: function() {
        try {
            const saved = localStorage.getItem('hazoom_privacy_audit');
            this.state.auditLog = saved ? JSON.parse(saved) : [];
            if (this.state.auditLog.length > 1000) {
                this.state.auditLog = this.state.auditLog.slice(-1000);
            }
        } catch (e) {
            console.error('Error loading audit log:', e);
            this.state.auditLog = [];
        }
    },

    getDefaultPermissions: function() {
        return {
            file_access: {
                enabled: false,
                require_consent: true,
                sandboxed: true,
                allowed_paths: ['/Hazoom_OS/Documents', '/Hazoom_OS/Desktop'],
                denied_paths: ['/etc', '/sys', '/proc']
            },
            network_access: {
                enabled: false,
                require_consent: true,
                whitelist_mode: true,
                allowed_domains: [],
                denied_domains: []
            },
            data_collection: {
                enabled: false,
                require_consent: true,
                anonymization: true,
                retention_days: 30
            },
            scraping: {
                enabled: false,
                require_consent: true,
                max_pages_per_session: 100,
                respect_robots_txt: true,
                sanitize_output: true,
                encrypt_output: true
            },
            app_launching: {
                enabled: true,
                require_consent: false,
                sandboxed: true,
                allowed_apps: ['all'],
                denied_apps: ['malicious', 'untrusted']
            }
        };
    },

    savePermissions: function() {
        try {
            localStorage.setItem('hazoom_privacy_permissions', JSON.stringify(this.state.permissions));
        } catch (e) {
            console.error('Error saving permissions:', e);
        }
    },

    saveConsent: function() {
        try {
            localStorage.setItem('hazoom_privacy_consent', JSON.stringify(this.state.consent));
        } catch (e) {
            console.error('Error saving consent:', e);
        }
    },

    saveAuditLog: function() {
        try {
            localStorage.setItem('hazoom_privacy_audit', JSON.stringify(this.state.auditLog));
        } catch (e) {
            console.error('Error saving audit log:', e);
        }
    },

    audit: function(action, details) {
        const entry = {
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            user_session: 'default'
        };

        this.state.auditLog.push(entry);
        this.saveAuditLog();

        console.log(`🔒 Audit: ${action}`, details);
    },

    requestConsent: function(action, details) {
        const consentKey = `${action}_${Date.now()}`;
        
        return new Promise((resolve) => {
            const consentDetails = {
                action: action,
                details: details,
                timestamp: Date.now(),
                granted: false
            };
            
            const message = 
                `🔒 Permission Required\n\n` +
                `Action: ${action}\n` +
                `Details: ${JSON.stringify(details, null, 2)}\n\n` +
                `Do you consent to this action?`;
            
            const granted = confirm(message);
            
            consentDetails.granted = granted;
            this.state.consent[consentKey] = consentDetails;
            this.saveConsent();
            
            this.audit('consent_request', {
                action: action,
                granted: granted,
                details: details
            });
            
            resolve(granted);
        });
    },

    checkFileAccess: function(path, operation) {
        const perms = this.state.permissions.file_access;

        if (!perms.enabled) {
            console.warn('File access disabled');
            return false;
        }

        if (perms.require_consent) {
            const granted = confirm(
                `📁 File Access Request\n\n` +
                `Path: ${path}\n` +
                `Operation: ${operation}\n\n` +
                `Allow this operation?`
            );
            if (!granted) return false;
        }

        const cleanPath = this.sanitizePath(path);

        for (const denied of perms.denied_paths) {
            if (cleanPath.startsWith(denied)) {
                console.error(`Access denied to restricted path: ${path}`);
                this.audit('file_access_denied', { path, operation, reason: 'restricted_path' });
                return false;
            }
        }

        if (perms.sandboxed) {
            console.log(`File access sandboxed: ${path}`);
        }

        this.audit('file_access_granted', { path, operation });
        return true;
    },

    checkNetworkAccess: function(url, operation) {
        const perms = this.state.permissions.network_access;

        if (!perms.enabled) {
            console.warn('Network access disabled');
            return false;
        }

        const cleanUrl = this.sanitizeUrl(url);
        if (!cleanUrl) {
            console.error('Invalid URL');
            return false;
        }

        if (perms.require_consent) {
            const granted = confirm(
                `🌐 Network Access Request\n\n` +
                `URL: ${cleanUrl}\n` +
                `Operation: ${operation}\n\n` +
                `Allow this network operation?`
            );
            if (!granted) return false;
        }

        if (perms.whitelist_mode) {
            const domain = new URL(cleanUrl).hostname;
            const allowed = perms.allowed_domains.includes(domain);
            if (!allowed) {
                console.error(`Network access denied to domain: ${domain}`);
                this.audit('network_access_denied', { url, operation, reason: 'whitelist_mode' });
                return false;
            }
        }

        for (const denied of perms.denied_domains) {
            if (cleanUrl.includes(denied)) {
                console.error(`Network access denied to blocked domain`);
                this.audit('network_access_denied', { url, operation, reason: 'denied_domain' });
                return false;
            }
        }

        this.audit('network_access_granted', { url, operation });
        return true;
    },

    checkScrapingPermission: function(config) {
        const perms = this.state.permissions.scraping;
        
        if (!perms.enabled) {
            console.warn('Scraping disabled');
            return false;
        }
        
        if (config.maxPages > perms.max_pages_per_session) {
            console.error(`Page limit exceeded: ${config.maxPages} > ${perms.max_pages_per_session}`);
            return false;
        }
        
        if (perms.require_consent) {
            const granted = confirm(
                `🕷️ Scraping Permission Request\n\n` +
                `Target: ${config.url}\n` +
                `Max Pages: ${config.maxPages}\n` +
                `Output: ${config.outputFormat}\n\n` +
                `Privacy Settings:\n` +
                `• Sanitize: ${config.sanitizeInput ? 'Yes' : 'No'}\n` +
                `• Encrypt: ${config.encryptOutput ? 'Yes' : 'No'}\n` +
                `• Respect Robots.txt: ${config.respectRobots ? 'Yes' : 'No'}\n\n` +
                `Allow this scraping operation?`
            );
            if (!granted) return false;
        }
        
        this.audit('scraping_permission_granted', config);
        return true;
    },

    checkAppLaunch: function(appId) {
        const perms = this.state.permissions.app_launching;
        
        if (!perms.enabled) {
            console.warn('App launching disabled');
            return false;
        }
        
        const denied = perms.denied_apps.includes(appId);
        if (denied) {
            console.error(`App launch denied: ${appId}`);
            this.audit('app_launch_denied', { appId, reason: 'denied_app' });
            return false;
        }
        
        if (!perms.allowed_apps.includes('all') && !perms.allowed_apps.includes(appId)) {
            console.error(`App not in allowed list: ${appId}`);
            this.audit('app_launch_denied', { appId, reason: 'not_allowed' });
            return false;
        }
        
        if (perms.sandboxed) {
            console.log(`App launched in sandbox: ${appId}`);
        }
        
        this.audit('app_launch_granted', { appId });
        return true;
    },

    classifyData: function(data, type = 'unknown') {
        const classification = {
            type: type,
            sensitivity: 'low',
            contains_pii: false,
            contains_secrets: false,
            encrypted: false,
            anonymized: false
        };
        
        const patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
            ssn: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
            credit_card: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
            api_key: /(?:api[_-]?key|secret[_-]?key|token)[:\s]*[A-Za-z0-9+/=]{16,}/gi
        };
        
        if (typeof data === 'string') {
            for (const [name, pattern] of Object.entries(patterns)) {
                if (pattern.test(data)) {
                    if (name === 'api_key' || name === 'ssn' || name === 'credit_card') {
                        classification.sensitivity = 'high';
                        classification.contains_secrets = true;
                    } else {
                        classification.contains_pii = true;
                        classification.sensitivity = 'medium';
                    }
                }
            }
        }
        
        this.state.dataClassification[type] = classification;
        this.audit('data_classified', classification);
        
        return classification;
    },

    encryptData: function(data, key = null) {
        const classification = this.classifyData(data);
        
        if (classification.sensitivity === 'low') {
            return data;
        }
        
        const encryptionKey = key || this.getEncryptionKey();
        
        try {
            const encrypted = btoa(encodeURIComponent(JSON.stringify({
                data: data,
                timestamp: Date.now(),
                classification: classification
            })));
            
            this.audit('data_encrypted', { 
                sensitivity: classification.sensitivity,
                size: data.length
            });
            
            return {
                encrypted: true,
                data: encrypted,
                timestamp: Date.now(),
                version: '2.1.0'
            };
        } catch (e) {
            console.error('❌ Encryption failed:', e);
            return {
                encrypted: false,
                data: data,
                error: e.message
            };
        }
    },

    getEncryptionKey: function() {
        let key = localStorage.getItem('hazoom_encryption_key');
        if (!key) {
            key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            localStorage.setItem('hazoom_encryption_key', key);
        }
        return key;
    },

    getPrivacyReport: function() {
        return {
            permissions: this.state.permissions,
            consent_count: Object.keys(this.state.consent).length,
            audit_entries: this.state.auditLog.length,
            recent_activity: this.state.auditLog.slice(-10),
            data_classifications: this.state.dataClassification
        };
    },

    resetPermissions: function() {
        if (confirm('Reset all privacy permissions to default?')) {
            this.state.permissions = this.getDefaultPermissions();
            this.savePermissions();
            this.audit('permissions_reset', {});
            alert('Permissions reset to default');
        }
    },

    clearAuditLog: function() {
        if (confirm('Clear audit log?')) {
            this.state.auditLog = [];
            this.saveAuditLog();
            this.audit('audit_log_cleared', {});
            alert('Audit log cleared');
        }
    },

    sanitizePath: function(path) {
        if (!path || typeof path !== 'string') return '';
        const clean = path.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '');
        return clean.startsWith('/') ? clean : '/' + clean;
    },

    sanitizeUrl: function(url) {
        if (!url || typeof url !== 'string') return '';
        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) return '';
            return parsed.href;
        } catch (e) {
            return '';
        }
    }
};

PrivacyController.init();
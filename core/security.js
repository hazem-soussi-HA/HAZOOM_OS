// ============================================
// HAZOOM OS - SECURITY MODULE
// ============================================

const Security = {
    // Configuration
    CONFIG: {
        MAX_LOGIN_ATTEMPTS: 5,
        LOGIN_TIMEOUT: 300000, // 5 minutes
        SESSION_TIMEOUT: 3600000, // 1 hour
        RATE_LIMIT: 100,
        RATE_WINDOW: 60000, // 1 minute
        ALLOWED_ORIGINS: ['http://localhost:8889', 'http://127.0.0.1:8889', 'https://hazoom-os.com']
    },

    // State
    state: {
        loginAttempts: {},
        sessions: {},
        rateLimit: {}
    },

    // Input sanitization
    sanitize: {
        html: function (str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        url: function (str) {
            try {
                const url = new URL(str);
                if (!['http:', 'https:'].includes(url.protocol)) {
                    return '';
                }
                return url.toString();
            } catch {
                return '';
            }
        },

        js: function (str) {
            return str.replace(/[<>]/g, '');
        },

        path: function (str) {
            return str.replace(/\.\./g, '').replace(/[\\\/]/g, '');
        }
    },

    // XSS Prevention
    preventXSS: {
        escape: function (str) {
            let result = str;
            result = result.replace(/&/g, '&amp;');
            result = result.replace(/</g, '&lt;');
            result = result.replace(/>/g, '&gt;');
            result = result.replace(/"/g, '&quot;');
            result = result.replace(/'/g, '&#039;');
            result = result.replace(/\//g, '&#x2F;');
            return result;
        },

        unescape: function (str) {
            let result = str;
            result = result.replace(/&amp;/g, '&');
            result = result.replace(/&lt;/g, '<');
            result = result.replace(/&gt;/g, '>');
            result = result.replace(/&quot;/g, '"');
            result = result.replace(/&#039;/g, "'");
            result = result.replace(/&#x2F;/g, '/');
            return result;
        }
    },

    // CSRF Protection
    csrf: {
        tokens: {},

        generate: function () {
            const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            this.tokens[token] = {
                created: Date.now(),
                used: false
            };
            return token;
        },

        validate: function (token) {
            const tokenData = this.tokens[token];
            if (!tokenData) return false;
            if (tokenData.used) return false;
            if (Date.now() - tokenData.created > Security.CONFIG.SESSION_TIMEOUT) {
                delete this.tokens[token];
                return false;
            }
            return true;
        },

        use: function (token) {
            if (this.tokens[token]) {
                this.tokens[token].used = true;
            }
        }
    },

    // Rate Limiting
    rateLimit: {
        check: function (identifier) {
            const now = Date.now();
            const window = Security.CONFIG.RATE_WINDOW;

            if (!Security.state.rateLimit[identifier]) {
                Security.state.rateLimit[identifier] = [];
            }

            // Clean old requests
            Security.state.rateLimit[identifier] = Security.state.rateLimit[identifier].filter(
                time => now - time < window
            );

            // Check limit
            if (Security.state.rateLimit[identifier].length >= Security.CONFIG.RATE_LIMIT) {
                return false;
            }

            // Record request
            Security.state.rateLimit[identifier].push(now);
            return true;
        },

        cleanup: function () {
            const now = Date.now();
            const window = Security.CONFIG.RATE_WINDOW;

            for (const id in Security.state.rateLimit) {
                Security.state.rateLimit[id] = Security.state.rateLimit[id].filter(
                    time => now - time < window
                );
            }
        }
    },

    // Session Management
    session: {
        create: function (userId, data = {}) {
            const sessionId = Array.from(crypto.getRandomValues(new Uint8Array(24)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            Security.state.sessions[sessionId] = {
                userId: userId,
                data: data,
                created: Date.now(),
                lastAccessed: Date.now()
            };

            // Save to localStorage
            localStorage.setItem('hazoom_session', sessionId);
            return sessionId;
        },

        get: function (sessionId) {
            const session = Security.state.sessions[sessionId];
            if (!session) return null;

            // Check timeout
            if (Date.now() - session.lastAccessed > Security.CONFIG.SESSION_TIMEOUT) {
                delete Security.state.sessions[sessionId];
                return null;
            }

            // Update last accessed
            session.lastAccessed = Date.now();
            return session;
        },

        destroy: function (sessionId) {
            delete Security.state.sessions[sessionId];
            localStorage.removeItem('hazoom_session');
        },

        validate: function () {
            const sessionId = localStorage.getItem('hazoom_session');
            if (!sessionId) return false;

            const session = this.get(sessionId);
            return session !== null;
        }
    },

    // Content Security
    contentSecurity: {
        validateScript: function (script) {
            // Check for dangerous patterns
            const dangerous = [
                /eval\s*\(/,
                /document\.write/,
                /innerHTML\s*=/,
                /outerHTML\s*=/,
                /setTimeout\s*\(/,
                /setInterval\s*\(/,
                /Function\s*\(/,
                /fromCharCode/,
                /\.on\w+\s*=/,
                /javascript:/i
            ];

            for (const pattern of dangerous) {
                if (pattern.test(script)) {
                    console.warn('Security: Dangerous script pattern detected');
                    return false;
                }
            }
            return true;
        },

        sanitizeHTML: function (html) {
            const temp = document.createElement('div');
            temp.textContent = html;
            return temp.innerHTML;
        }
    },

    // Event Security
    events: {
        addSecureListener: function (element, event, handler, options = {}) {
            const secureHandler = function (e) {
                // Prevent default for certain events
                if (['contextmenu', 'dragstart', 'selectstart'].includes(event)) {
                    if (options.preventDefault !== false) {
                        e.preventDefault();
                    }
                }

                // Sanitize input for form events
                if (['submit', 'input', 'change'].includes(event)) {
                    if (e.target && e.target.value) {
                        e.target.value = Security.sanitize.js(e.target.value);
                    }
                }

                // Call original handler
                if (typeof handler === 'function') {
                    return handler(e);
                }
            };

            element.addEventListener(event, secureHandler, options);
        }
    },

    // Storage Security
    storage: {
        secureSet: function (key, value) {
            try {
                const encrypted = btoa(JSON.stringify(value));
                localStorage.setItem(key, encrypted);
                return true;
            } catch (e) {
                console.error('Storage secureSet error:', e);
                return false;
            }
        },

        secureGet: function (key) {
            try {
                const encrypted = localStorage.getItem(key);
                if (!encrypted) return null;

                const decrypted = atob(encrypted);
                return JSON.parse(decrypted);
            } catch (e) {
                console.error('Storage secureGet error:', e);
                return null;
            }
        },

        clear: function (prefix = 'hazoom_') {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    localStorage.removeItem(key);
                }
            }
        }
    },

    // Initialize Security
    init: function () {
        console.log('🛡️ HAZOOM OS Security Module Initialized');

        // Start cleanup interval
        setInterval(() => {
            this.rateLimit.cleanup();

            // Clean expired sessions
            const now = Date.now();
            for (const id in this.state.sessions) {
                if (now - this.state.sessions[id].lastAccessed > this.CONFIG.SESSION_TIMEOUT) {
                    delete this.state.sessions[id];
                }
            }
        }, 60000); // Every minute

        // Add CSP meta tag if not present
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://127.0.0.1:8000 http://127.0.0.1:8001 http://127.0.0.1:8002 http://localhost:8000 http://localhost:8001 http://localhost:8002; frame-src 'self' data:;";
            document.head.appendChild(meta);
        }

        // Prevent right-click on sensitive elements
        document.addEventListener('contextmenu', function (e) {
            if (e.target.closest('.window-content')) {
                e.preventDefault();
            }
        });

        // Prevent text selection on sensitive elements
        document.addEventListener('selectstart', function (e) {
            if (e.target.closest('.secure-input')) {
                e.preventDefault();
            }
        });
    }
};

// Initialize security module
Security.init();

// Expose security globally
window.Security = Security;

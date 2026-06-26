// ============================================
// HAZOOM OS SECURE SUPERVISION SERVER
// ============================================
// Serves admin monitor without exposing .html extensions
// Runs in background on port 8080

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const CONFIG = {
    PORT: 8080,
    HOST: 'localhost',
    SECRET_KEY: process.env.SECRET_KEY,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    RATE_LIMIT: 100, // requests per minute
    LOG_FILE: 'secure_server.log'
};

// Validate required environment variables
if (!CONFIG.SECRET_KEY) {
    console.error('FATAL ERROR: SECRET_KEY environment variable is not set');
    process.exit(1);
}

// MIME types mapping
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

// Security headers
const SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Session management
const sessions = new Map();
const rateLimits = new Map();

// Secure routes mapping (no .html extensions exposed)
const ROUTES = {
    '/': '/apps/admin_monitor.html',
    '/admin': '/apps/admin_monitor.html',
    '/monitor': '/apps/admin_monitor.html',
    '/supervision': '/apps/admin_monitor.html',
    '/dashboard': '/apps/admin_monitor.html',
    '/api/settings': '/apps/settings.html',
    '/api/agents': '/apps/ai_assistant.html',
    '/api/observations': '/apps/quantum_monitor.html',
    '/api/deployments': '/apps/hazoom.html',
    '/api/analytics': '/apps/consciousness_portal.html',
    
    // Heat monitor endpoint
    '/heat': 'heat_endpoint',
    
    // Static assets (also without extensions)
    '/css/hazoom-os': '/hazoom-os.css',
    '/css/admin-monitor': '/apps/admin_monitor.html',
    
    // API endpoints
    '/api/login': 'login_endpoint',
    '/api/logout': 'logout_endpoint',
    '/api/metrics': 'metrics_endpoint',
    '/api/supervision': 'supervision_endpoint',
    '/api/actions': 'actions_endpoint',
    '/api/export': 'export_endpoint'
};

// ============================================
// SECURITY FUNCTIONS
// ============================================

function generateSessionId() {
    return require('crypto').randomBytes(32).toString('hex');
}

function validateSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return false;
    
    const now = Date.now();
    if (now - session.lastActivity > CONFIG.SESSION_TIMEOUT) {
        sessions.delete(sessionId);
        return false;
    }
    
    session.lastActivity = now;
    return true;
}

function createSession(username) {
    const sessionId = generateSessionId();
    sessions.set(sessionId, {
        username: username,
        created: Date.now(),
        lastActivity: Date.now()
    });
    return sessionId;
}

function checkRateLimit(clientIP) {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    if (!rateLimits.has(clientIP)) {
        rateLimits.set(clientIP, []);
    }
    
    const requests = rateLimits.get(clientIP).filter(time => time > windowStart);
    rateLimits.set(clientIP, requests);
    
    if (requests.length >= CONFIG.RATE_LIMIT) {
        return false;
    }
    
    requests.push(now);
    return true;
}

function getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const socket = req.socket.remoteAddress;
    
    return (forwarded || realIP || socket || 'unknown').split(',')[0].trim();
}

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    
    console.log(logMessage.trim());
    
    // Append to log file
    fs.appendFileSync(CONFIG.LOG_FILE, logMessage, { encoding: 'utf8' });
}

// ============================================
// REQUEST HANDLERS
// ============================================

function handleLogin(req, res, postData) {
    try {
        const data = JSON.parse(postData);
        
        const adminUser = process.env.ADMIN_USER || 'admin';
        const adminPass = process.env.ADMIN_PASS;
        if (!adminPass) {
            res.status(500).json({ error: 'Server not configured: ADMIN_PASS not set' });
            return;
        }
        // SECURITY FIX: Use constant-time comparison to prevent timing attacks
        const crypto = require('crypto');
        const userMatch = crypto.timingSafeEqual(
            Buffer.from(data.username),
            Buffer.from(adminUser)
        );
        const passMatch = crypto.timingSafeEqual(
            Buffer.from(data.password),
            Buffer.from(adminPass)
        );
        if (userMatch && passMatch) {
            const sessionId = createSession(data.username);
            
            log(`Login successful for ${data.username}`, 'success');
            
            return {
                success: true,
                sessionId: sessionId,
                message: 'Login successful',
                redirect: '/admin'
            };
        } else {
            log(`Failed login attempt for ${data.username}`, 'warning');
            return {
                success: false,
                message: 'Invalid credentials'
            };
        }
    } catch (error) {
        log(`Login error: ${error.message}`, 'error');
        return {
            success: false,
            message: 'Login error'
        };
    }
}

function handleMetrics(req, res, sessionId) {
    if (!validateSession(sessionId)) {
        return { error: 'Unauthorized', code: 401 };
    }
    
    // Generate realistic metrics
    const metrics = {
        cpu: 45 + (Math.random() - 0.5) * 20,
        memory: 6.2 + (Math.random() - 0.5) * 1.5,
        disk: 142,
        network: 1.2 + (Math.random() - 0.5) * 0.3,
        agents: 12,
        success: 96.8 + (Math.random() - 0.5) * 1,
        health: 98.5 + (Math.random() - 0.5) * 0.5,
        timestamp: new Date().toISOString()
    };
    
    return metrics;
}

function handleSupervision(req, res, sessionId, postData) {
    if (!validateSession(sessionId)) {
        return { error: 'Unauthorized', code: 401 };
    }
    
    const data = postData ? JSON.parse(postData) : {};
    const action = data.action;
    
    // Simulate supervision data
    const cpuValue = 45 + (Math.random() - 0.5) * 20;
    const memoryValue = 6.2 + (Math.random() - 0.5) * 1.5;
    
    const response = {
        cpu: cpuValue,
        memory: memoryValue,
        processing: Math.floor(20 + Math.random() * 30),
        efficiency: Math.max(85, Math.min(99, 96 - (cpuValue - 45) * 0.2)),
        responseTime: Math.floor(30 + (cpuValue - 45) * 0.5 + (memoryValue - 6) * 5),
        alerts: data.alerts || 0,
        timestamp: new Date().toISOString()
    };
    
    if (action) {
        log(`Supervision action: ${action}`, 'info');
        response.actionResult = `Action ${action} completed`;
    }
    
    return response;
}

function handleActions(req, res, sessionId, postData) {
    if (!validateSession(sessionId)) {
        return { error: 'Unauthorized', code: 401 };
    }
    
    try {
        const data = JSON.parse(postData);
        const { target, action } = data;
        
        log(`Action executed: ${target} - ${action}`, 'info');
        
        // Simulate action effects
        let result = {};
        
        switch(target) {
            case 'cpu':
                if (action === 'throttle') {
                    result = { cpuReduction: 15, message: 'CPU throttled' };
                } else if (action === 'optimize') {
                    result = { efficiencyGain: 2, message: 'CPU optimized' };
                } else if (action === 'analyze') {
                    result = { processes: 3, message: 'Analysis complete' };
                }
                break;
                
            case 'memory':
                if (action === 'clear') {
                    result = { memoryFreed: 1.2, message: 'Memory cleared' };
                } else if (action === 'compact') {
                    result = { responseImprovement: 5, message: 'Memory compacted' };
                } else if (action === 'profile') {
                    result = { leaksFound: 2, message: 'Profile complete' };
                }
                break;
                
            case 'system':
                if (action === 'emergency') {
                    result = { status: 'stopped', alerts: 10, message: 'Emergency stop' };
                } else if (action === 'restart') {
                    result = { status: 'restarted', message: 'System restarted' };
                } else if (action === 'pause') {
                    result = { status: 'paused', message: 'System paused' };
                } else if (action === 'resume') {
                    result = { status: 'resumed', message: 'System resumed' };
                }
                break;
        }
        
        return { success: true, ...result };
        
    } catch (error) {
        log(`Action error: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}

function handleExport(req, res, sessionId) {
    if (!validateSession(sessionId)) {
        return { error: 'Unauthorized', code: 401 };
    }
    
    const exportData = {
        timestamp: new Date().toISOString(),
        session: sessions.get(sessionId),
        metrics: {
            cpu: 45 + (Math.random() - 0.5) * 20,
            memory: 6.2 + (Math.random() - 0.5) * 1.5,
            processing: Math.floor(20 + Math.random() * 30),
            efficiency: 96,
            responseTime: 45,
            alerts: 0
        },
        history: Array.from({ length: 10 }, (_, i) => ({
            time: new Date(Date.now() - i * 1000).toISOString(),
            cpu: 45 + (Math.random() - 0.5) * 20,
            memory: 6.2 + (Math.random() - 0.5) * 1.5
        }))
    };
    
    log(`Data exported for ${sessions.get(sessionId).username}`, 'success');
    
    return exportData;
}

function handleHeat(req, res) {
    const components = [
        "Core Kernel", "Memory Mgmt", "FS Driver", "Network Stack", "Scheduler",
        "Quantum Bridge", "Spirit Core", "Security Daemon", "I/O Bus", "UI Shell"
    ];
    
    const heatVector = components.map(() => {
        return Math.random() * 100;
    });
    
    const response = {
        timestamp: new Date().toISOString(),
        simulation_parameters: {
            alpha: 0.1,
            dt: 0.1,
            points: 10
        },
        components: components,
        heat_vector: heatVector.map(h => Math.round(h * 100) / 100),
        unit: "Quantum Strain"
    };
    
    log(`Heat data requested`, 'info');
    
    return response;
}

// ============================================
// SERVER CORE
// ============================================

const server = http.createServer((req, res) => {
    const clientIP = getClientIP(req);
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Rate limiting
    if (!checkRateLimit(clientIP)) {
        res.writeHead(429, { 
            'Content-Type': 'application/json',
            ...SECURITY_HEADERS
        });
        res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
        log(`Rate limit exceeded from ${clientIP}`, 'warning');
        return;
    }
    
    // Handle different request types
    if (req.method === 'GET') {
        handleGetRequest(req, res, pathname, clientIP);
    } else if (req.method === 'POST') {
        handlePostRequest(req, res, pathname, clientIP);
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
});

function handleGetRequest(req, res, pathname, clientIP) {
    // Special handler for /heat endpoint (no auth required)
    if (pathname === '/heat') {
        const responseData = handleHeat(req, res);
        
        if (!res.headersSent) {
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
        }
        res.end(JSON.stringify(responseData));
        return;
    }
    
    // Check if it's an API route
    const route = ROUTES[pathname];
    
    if (route && route.startsWith('/')) {
        // Serve the HTML file without exposing extension
        const filePath = path.join(__dirname, route);
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                // Only send response if headers haven't been sent
                if (!res.headersSent) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not found' }));
                }
                log(`404: ${pathname} from ${clientIP}`, 'warning');
                return;
            }
            
            // Serve as HTML but don't expose extension in URL
            if (!res.headersSent) {
                res.writeHead(200, { 
                    'Content-Type': 'text/html',
                    'X-Served-By': 'HAZOOM-Secure-Server'
                });
            }
            res.end(data);
            log(`Served: ${pathname} -> ${route} from ${clientIP}`, 'info');
        });
    } else if (route && route.startsWith('api_')) {
        // API endpoint
        const sessionId = req.headers['x-session-id'];
        
        let responseData = { error: 'Not implemented' };
        
        if (route === 'metrics_endpoint') {
            responseData = handleMetrics(req, res, sessionId);
        } else if (route === 'supervision_endpoint') {
            responseData = handleSupervision(req, res, sessionId);
        } else if (route === 'export_endpoint') {
            responseData = handleExport(req, res, sessionId);
        }
        
        if (responseData.code === 401) {
            if (!res.headersSent) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
            }
            res.end(JSON.stringify({ error: 'Unauthorized' }));
        } else {
            if (!res.headersSent) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
            }
            res.end(JSON.stringify(responseData));
        }
    } else {
        // Try to serve static files
        const staticPath = path.join(__dirname, pathname);
        
        fs.readFile(staticPath, (err, data) => {
            if (err) {
                if (!res.headersSent) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Not found' }));
                }
                return;
            }
            
            const ext = path.extname(staticPath);
            const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
            
            if (!res.headersSent) {
                res.writeHead(200, { 'Content-Type': mimeType });
            }
            res.end(data);
        });
    }
}

function handlePostRequest(req, res, pathname, clientIP) {
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
        
        // Limit body size
        if (body.length > 1024 * 1024) { // 1MB
            req.destroy();
            if (!res.headersSent) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
            }
            res.end(JSON.stringify({ error: 'Payload too large' }));
            log(`Payload too large from ${clientIP}`, 'warning');
            return;
        }
    });
    
    req.on('end', () => {
        const route = ROUTES[pathname];
        
        if (route === 'login_endpoint') {
            const responseData = handleLogin(req, res, body);
            
            if (responseData.success) {
                // Set secure cookie - need to set headers here for cookie
                if (!res.headersSent) {
                    res.writeHead(200, { 
                        'Content-Type': 'application/json',
                        'Set-Cookie': `sessionId=${responseData.sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=1800`
                    });
                }
                res.end(JSON.stringify(responseData));
            } else {
                if (!res.headersSent) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                }
                res.end(JSON.stringify(responseData));
            }
        } else if (route === 'logout_endpoint') {
            const sessionId = req.headers['x-session-id'];
            if (sessionId) {
                sessions.delete(sessionId);
                log(`Logout from ${clientIP}`, 'info');
            }
            if (!res.headersSent) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
            }
            res.end(JSON.stringify({ success: true, message: 'Logged out' }));
        } else if (route === 'actions_endpoint') {
            const sessionId = req.headers['x-session-id'];
            const responseData = handleActions(req, res, sessionId, body);
            
            if (!res.headersSent) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
            }
            res.end(JSON.stringify(responseData));
        } else if (route === 'supervision_endpoint') {
            const sessionId = req.headers['x-session-id'];
            const responseData = handleSupervision(req, res, sessionId, body);
            
            if (!res.headersSent) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
            }
            res.end(JSON.stringify(responseData));
        } else {
            if (!res.headersSent) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
            }
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    });
}

// ============================================
// START SERVER
// ============================================

server.listen(CONFIG.PORT, CONFIG.HOST, () => {
    log(`🚀 HAZOOM OS Secure Server started`, 'success');
    log(`📍 Access: http://${CONFIG.HOST}:${CONFIG.PORT}/admin`, 'info');
    log(`🔒 No .html extensions exposed`, 'info');
    log(`📊 Supervision system running in background`, 'info');
    log(`📝 Logs: ${CONFIG.LOG_FILE}`, 'info');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    log('🛑 Server shutting down gracefully...', 'warning');
    server.close(() => {
        log('✅ Server closed', 'success');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    log('🛑 Server interrupted (Ctrl+C)', 'warning');
    server.close(() => {
        log('✅ Server closed', 'success');
        process.exit(0);
    });
});

// Error handling
server.on('error', (error) => {
    log(`❌ Server error: ${error.message}`, 'error');
    process.exit(1);
});
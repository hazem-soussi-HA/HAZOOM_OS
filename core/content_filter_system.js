// ============================================
// HAZOOM OS CONTENT FILTER & PARENTAL CONTROL
// ============================================
// Secure content filtering system with AI-powered moderation
// Blocks inappropriate content and provides parental controls

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    PORT: 8081,
    HOST: 'localhost',
    FILTER_MODE: 'STRICT', // STRICT, MODERATE, LENIENT
    LOG_FILE: 'content_filter.log',
    BLOCKLIST_FILE: 'blocklist.json',
    ALLOWLIST_FILE: 'allowlist.json'
};

// Security headers
const SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Content categories
const CONTENT_CATEGORIES = {
    ADULT: ['adult', 'porn', 'explicit', 'nsfw', 'xxx', 'mature'],
    VIOLENCE: ['violence', 'gore', 'blood', 'kill', 'murder', 'weapon'],
    HATE: ['hate', 'racist', 'discrimination', 'bigotry', 'extremism'],
    GAMBLING: ['gambling', 'casino', 'betting', 'lottery', 'poker'],
    DRUGS: ['drugs', 'alcohol', 'substance', 'addiction', 'narcotic']
};

// Safe keywords for educational content
const SAFE_KEYWORDS = [
    'education', 'learning', 'school', 'science', 'technology',
    'mathematics', 'history', 'art', 'music', 'literature',
    'health', 'safety', 'security', 'programming', 'coding'
];

// ============================================
// FILTER ENGINE
// ============================================

class ContentFilter {
    constructor() {
        this.blocklist = this.loadBlocklist();
        this.allowlist = this.loadAllowlist();
        this.patterns = this.compilePatterns();
    }

    loadBlocklist() {
        try {
            if (fs.existsSync(CONFIG.BLOCKLIST_FILE)) {
                return JSON.parse(fs.readFileSync(CONFIG.BLOCKLIST_FILE, 'utf8'));
            }
        } catch (error) {
            log(`Error loading blocklist: ${error.message}`, 'error');
        }
        return [];
    }

    loadAllowlist() {
        try {
            if (fs.existsSync(CONFIG.ALLOWLIST_FILE)) {
                return JSON.parse(fs.readFileSync(CONFIG.ALLOWLIST_FILE, 'utf8'));
            }
        } catch (error) {
            log(`Error loading allowlist: ${error.message}`, 'error');
        }
        return [];
    }

    compilePatterns() {
        const patterns = {};
        for (const [category, keywords] of Object.entries(CONTENT_CATEGORIES)) {
            patterns[category] = keywords.map(keyword => 
                new RegExp(`\\b${keyword}\\b`, 'gi')
            );
        }
        return patterns;
    }

    analyzeContent(content, context = {}) {
        const result = {
            safe: true,
            category: null,
            confidence: 0,
            matches: [],
            recommendations: []
        };

        // Check allowlist first
        if (this.allowlist.some(item => content.toLowerCase().includes(item.toLowerCase()))) {
            result.safe = true;
            result.confidence = 100;
            result.recommendations.push('Content is in allowlist');
            return result;
        }

        // Check blocklist
        if (this.blocklist.some(item => content.toLowerCase().includes(item.toLowerCase()))) {
            result.safe = false;
            result.confidence = 100;
            result.recommendations.push('Content matches blocklist');
            return result;
        }

        // Analyze by categories
        let maxConfidence = 0;
        let detectedCategory = null;

        for (const [category, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                const matches = content.match(pattern);
                if (matches) {
                    const confidence = Math.min(matches.length * 20, 100);
                    if (confidence > maxConfidence) {
                        maxConfidence = confidence;
                        detectedCategory = category;
                    }
                    result.matches.push({ category, pattern: pattern.source, count: matches.length });
                }
            }
        }

        // Apply filter mode
        const thresholds = {
            STRICT: 10,
            MODERATE: 30,
            LENIENT: 50
        };

        const threshold = thresholds[CONFIG.FILTER_MODE];

        if (maxConfidence >= threshold) {
            result.safe = false;
            result.category = detectedCategory;
            result.confidence = maxConfidence;
            result.recommendations.push(`Detected ${detectedCategory} content (${maxConfidence}% confidence)`);
            result.recommendations.push(`Filter mode: ${CONFIG.FILTER_MODE}`);
        } else if (maxConfidence > 0) {
            result.confidence = maxConfidence;
            result.recommendations.push(`Low confidence ${detectedCategory} content detected (${maxConfidence}%)`);
        }

        // Check for safe keywords
        const safeMatches = SAFE_KEYWORDS.filter(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
        );
        if (safeMatches.length > 0) {
            result.recommendations.push(`Safe keywords detected: ${safeMatches.join(', ')}`);
            if (result.confidence < 20) {
                result.safe = true; // Override if mostly safe content
            }
        }

        return result;
    }

    filterRequest(req, res, content) {
        const analysis = this.analyzeContent(content, {
            url: req.url,
            method: req.method,
            userAgent: req.headers['user-agent']
        });

        if (!analysis.safe) {
            log(`Blocked content: ${analysis.category} (${analysis.confidence}% confidence)`, 'warning');
            
            res.writeHead(403, { 
                'Content-Type': 'application/json',
                ...SECURITY_HEADERS
            });
            
            return {
                blocked: true,
                reason: analysis.category,
                confidence: analysis.confidence,
                message: 'Content blocked by filter',
                recommendations: analysis.recommendations
            };
        }

        log(`Allowed content: ${analysis.confidence}% safe`, 'info');
        
        return {
            blocked: false,
            analysis: analysis
        };
    }
}

// ============================================
// PARENTAL CONTROLS
// ============================================

class ParentalControls {
    constructor() {
        this.profiles = this.loadProfiles();
        this.timeLimits = this.loadTimeLimits();
    }

    loadProfiles() {
        try {
            const data = fs.readFileSync('parental_profiles.json', 'utf8');
            return JSON.parse(data);
        } catch {
            return {
                default: {
                    age: 13,
                    restrictions: ['ADULT', 'VIOLENCE', 'HATE', 'GAMBLING', 'DRUGS'],
                    timeLimit: 120, // minutes per day
                    safeSearch: true
                }
            };
        }
    }

    loadTimeLimits() {
        try {
            const data = fs.readFileSync('time_limits.json', 'utf8');
            return JSON.parse(data);
        } catch {
            return {};
        }
    }

    checkAccess(profileName, resource) {
        const profile = this.profiles[profileName] || this.profiles.default;
        
        // Check time limits
        const today = new Date().toDateString();
        const usage = this.timeLimits[profileName]?.[today] || 0;
        
        if (usage >= profile.timeLimit) {
            return {
                allowed: false,
                reason: 'Time limit exceeded',
                usage: usage,
                limit: profile.timeLimit
            };
        }

        // Check restrictions
        const contentFilter = new ContentFilter();
        const analysis = contentFilter.analyzeContent(resource);
        
        if (!analysis.safe && analysis.category && profile.restrictions.includes(analysis.category)) {
            return {
                allowed: false,
                reason: `Restricted category: ${analysis.category}`,
                category: analysis.category
            };
        }

        return { allowed: true };
    }

    recordUsage(profileName, minutes) {
        const today = new Date().toDateString();
        
        if (!this.timeLimits[profileName]) {
            this.timeLimits[profileName] = {};
        }
        
        if (!this.timeLimits[profileName][today]) {
            this.timeLimits[profileName][today] = 0;
        }
        
        this.timeLimits[profileName][today] += minutes;
        
        fs.writeFileSync('time_limits.json', JSON.stringify(this.timeLimits, null, 2));
    }

    createProfile(name, config) {
        this.profiles[name] = {
            age: config.age || 13,
            restrictions: config.restrictions || ['ADULT', 'VIOLENCE', 'HATE'],
            timeLimit: config.timeLimit || 120,
            safeSearch: config.safeSearch !== false
        };
        
        fs.writeFileSync('parental_profiles.json', JSON.stringify(this.profiles, null, 2));
        log(`Created parental profile: ${name}`, 'success');
    }
}

// ============================================
// AI MODERATION
// ============================================

class AIModerator {
    constructor() {
        this.toxicityThreshold = 0.8;
        this.safetyPatterns = {
            profanity: ['damn', 'hell', 'crap'], // Basic example
            personalInfo: ['email', 'phone', 'address', 'ssn'],
            phishing: ['click here', 'free', 'win', 'prize']
        };
    }

    analyzeText(text) {
        const result = {
            toxicity: 0,
            safetyScore: 100,
            flags: [],
            suggestions: []
        };

        // Check for toxicity indicators
        const words = text.toLowerCase().split(/\s+/);
        let toxicCount = 0;

        for (const word of words) {
            if (this.safetyPatterns.profanity.includes(word)) {
                toxicCount++;
                result.flags.push(`Profanity: ${word}`);
            }
            if (this.safetyPatterns.personalInfo.some(pattern => text.toLowerCase().includes(pattern))) {
                result.flags.push('Potential personal information');
            }
            if (this.safetyPatterns.phishing.some(pattern => text.toLowerCase().includes(pattern))) {
                result.flags.push('Potential phishing attempt');
            }
        }

        // Calculate toxicity score
        result.toxicity = Math.min((toxicCount / words.length) * 100, 100);
        result.safetyScore = 100 - result.toxicity;

        if (result.toxicity > this.toxicityThreshold * 100) {
            result.suggestions.push('Content may be inappropriate');
            result.suggestions.push('Consider revising language');
        }

        if (result.flags.includes('Potential personal information')) {
            result.suggestions.push('Remove personal information');
        }

        return result;
    }

    moderateContent(content) {
        const analysis = this.analyzeText(content);
        
        if (analysis.safetyScore < 70) {
            return {
                approved: false,
                reason: 'Content violates safety guidelines',
                analysis: analysis
            };
        }

        return {
            approved: true,
            analysis: analysis
        };
    }
}

// ============================================
// SERVER
// ============================================

const http = require('http');
const url = require('url');

const contentFilter = new ContentFilter();
const parentalControls = new ParentalControls();
const aiModerator = new AIModerator();

const server = http.createServer((req, res) => {
    const clientIP = getClientIP(req);
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Security headers
    res.writeHead(200, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });

    // Rate limiting
    if (!checkRateLimit(clientIP)) {
        res.writeHead(429, { 'Content-Type': 'application/json', ...SECURITY_HEADERS });
        res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
        log(`Rate limit exceeded from ${clientIP}`, 'warning');
        return;
    }

    if (req.method === 'POST') {
        handlePostRequest(req, res, pathname, clientIP);
    } else {
        handleGetRequest(req, res, pathname, clientIP);
    }
});

function handleGetRequest(req, res, pathname, clientIP) {
    if (pathname === '/') {
        const response = {
            service: 'HAZOOM OS Content Filter System',
            version: '1.0.0',
            endpoints: {
                '/api/filter': 'POST - Analyze content',
                '/api/parental/profile': 'POST - Create profile',
                '/api/parental/check': 'GET - Check access',
                '/api/moderate': 'POST - AI moderation'
            },
            filterMode: CONFIG.FILTER_MODE
        };
        res.end(JSON.stringify(response));
        log(`Served info to ${clientIP}`, 'info');
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
}

function handlePostRequest(req, res, pathname, clientIP) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
        
        if (body.length > 1024 * 1024) {
            req.destroy();
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Payload too large' }));
            log(`Payload too large from ${clientIP}`, 'warning');
        }
    });

    req.on('end', () => {
        try {
            const data = JSON.parse(body);

            if (pathname === '/api/filter') {
                const result = contentFilter.filterRequest(req, res, data.content || data.text || '');
                res.end(JSON.stringify(result));
            } else if (pathname === '/api/parental/profile') {
                parentalControls.createProfile(data.name || 'default', data.config || {});
                res.end(JSON.stringify({ success: true, message: 'Profile created' }));
            } else if (pathname === '/api/parental/check') {
                const result = parentalControls.checkAccess(data.profile || 'default', data.resource || '');
                res.end(JSON.stringify(result));
            } else if (pathname === '/api/moderate') {
                const result = aiModerator.moderateContent(data.content || '');
                res.end(JSON.stringify(result));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            }

            log(`Processed ${pathname} for ${clientIP}`, 'info');
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON', message: error.message }));
            log(`JSON parse error: ${error.message}`, 'error');
        }
    });
}

// ============================================
// UTILITIES
// ============================================

function getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const socket = req.socket.remoteAddress;
    return (forwarded || realIP || socket || 'unknown').split(',')[0].trim();
}

function checkRateLimit(clientIP) {
    const now = Date.now();
    const windowStart = now - 60000;
    
    if (!rateLimits.has(clientIP)) {
        rateLimits.set(clientIP, []);
    }
    
    const requests = rateLimits.get(clientIP).filter(time => time > windowStart);
    rateLimits.set(clientIP, requests);
    
    if (requests.length >= 100) {
        return false;
    }
    
    requests.push(now);
    return true;
}

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    
    console.log(logMessage.trim());
    
    try {
        fs.appendFileSync(CONFIG.LOG_FILE, logMessage, { encoding: 'utf8' });
    } catch (error) {
        console.error('Failed to write log:', error.message);
    }
}

// ============================================
// START SERVER
// ============================================

const rateLimits = new Map();

server.listen(CONFIG.PORT, CONFIG.HOST, () => {
    log(`🚀 HAZOOM OS Content Filter System started`, 'success');
    log(`📍 Access: http://${CONFIG.HOST}:${CONFIG.PORT}`, 'info');
    log(`🔒 Filter Mode: ${CONFIG.FILTER_MODE}`, 'info');
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
'use strict';
const crypto = require('crypto');

class AuthManager {
    constructor(kernel) {
        this.kernel = kernel;
        this.secret = crypto.randomBytes(64).toString('hex');
        this.sessions = new Map();
        this.refreshTokens = new Map();
        this.blacklistedTokens = new Set();
        this.loginAttempts = new Map();
        this.maxLoginAttempts = 5;
        this.lockoutMinutes = 15;
        this.tokenExpiry = '24h';
        this.refreshExpiry = '7d';
        this.users = new Map();
        this._seedUsers();
    }

    _seedUsers() {
        this.register('root', 'root', 'admin');
        this.register('hazem', 'hazem', 'user');
    }

    _hmac(payload) {
        return crypto.createHmac('sha256', this.secret)
            .update(JSON.stringify(payload))
            .digest('base64url');
    }

    _parseExpiry(str) {
        const m = str.match(/^(\d+)([smhd])$/);
        if (!m) return 24 * 60 * 60 * 1000;
        const v = parseInt(m[1]);
        switch (m[2]) {
            case 's': return v * 1000;
            case 'm': return v * 60 * 1000;
            case 'h': return v * 60 * 60 * 1000;
            case 'd': return v * 24 * 60 * 60 * 1000;
            default: return 24 * 60 * 60 * 1000;
        }
    }

    createToken(payload, expiresInMs) {
        const header = { alg: 'HS256', typ: 'JWT' };
        const now = Math.floor(Date.now() / 1000);
        const exp = now + Math.floor((expiresInMs || this._parseExpiry(this.tokenExpiry)) / 1000);
        const body = { ...payload, iat: now, exp, jti: crypto.randomBytes(16).toString('hex') };
        const hb = Buffer.from(JSON.stringify(header)).toString('base64url');
        const bb = Buffer.from(JSON.stringify(body)).toString('base64url');
        const sig = this._hmac({ header, body });
        return `${hb}.${bb}.${sig}`;
    }

    verifyToken(token) {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const [hb, bb, sig] = parts;
        try {
            const header = JSON.parse(Buffer.from(hb, 'base64url').toString());
            const body = JSON.parse(Buffer.from(bb, 'base64url').toString());
            if (sig !== this._hmac({ header, body })) return null;
            if (body.exp * 1000 < Date.now()) return null;
            if (this.blacklistedTokens.has(token)) return null;
            return { header, body };
        } catch {
            return null;
        }
    }

    hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync(password, salt, 64).toString('hex');
        return `${salt}:${hash}`;
    }

    verifyPassword(password, stored) {
        const [salt, hash] = stored.split(':');
        return crypto.scryptSync(password, salt, 64).toString('hex') === hash;
    }

    register(username, password, role = 'user') {
        if (!username || username.length < 3) return { error: 'Username must be at least 3 characters' };
        if (!password || password.length < 4) return { error: 'Password must be at least 4 characters' };
        if (this.users.has(username)) return { error: 'User already exists' };
        const user = {
            username,
            role: ['admin', 'user'].includes(role) ? role : 'user',
            passwordHash: this.hashPassword(password),
            uid: this.users.size + 1000,
            createdAt: new Date().toISOString()
        };
        this.users.set(username, user);
        return { username, role: user.role, uid: user.uid };
    }

    login(username, password) {
        const now = Date.now();
        const attempts = this.loginAttempts.get(username) || { count: 0, lockUntil: 0 };

        if (attempts.lockUntil > now) {
            const rem = Math.ceil((attempts.lockUntil - now) / 60000);
            return { error: `Account locked. Try again in ${rem} minutes.` };
        }

        const user = this.users.get(username);
        if (!user || !this.verifyPassword(password, user.passwordHash)) {
            attempts.count++;
            if (attempts.count >= this.maxLoginAttempts) {
                attempts.lockUntil = now + this.lockoutMinutes * 60 * 1000;
                attempts.count = 0;
            }
            this.loginAttempts.set(username, attempts);
            return { error: 'Invalid credentials' };
        }

        this.loginAttempts.delete(username);
        const payload = { username: user.username, role: user.role, uid: user.uid };
        const token = this.createToken(payload);
        const refreshToken = crypto.randomBytes(32).toString('hex');
        this.refreshTokens.set(refreshToken, {
            username: user.username,
            createdAt: now,
            expiresAt: now + this._parseExpiry(this.refreshExpiry)
        });
        return { token, refreshToken, user: { username: user.username, role: user.role, uid: user.uid } };
    }

    refreshToken(refreshToken) {
        const data = this.refreshTokens.get(refreshToken);
        if (!data || data.expiresAt < Date.now()) {
            if (data) this.refreshTokens.delete(refreshToken);
            return { error: 'Invalid or expired refresh token' };
        }
        const user = this.users.get(data.username);
        if (!user) return { error: 'User not found' };
        const payload = { username: user.username, role: user.role, uid: user.uid };
        const token = this.createToken(payload);
        const newRefresh = crypto.randomBytes(32).toString('hex');
        this.refreshTokens.delete(refreshToken);
        this.refreshTokens.set(newRefresh, {
            username: user.username,
            createdAt: Date.now(),
            expiresAt: Date.now() + this._parseExpiry(this.refreshExpiry)
        });
        return { token, refreshToken: newRefresh };
    }

    logout(token) {
        this.blacklistedTokens.add(token);
        if (this.blacklistedTokens.size > 50000) this.blacklistedTokens = new Set();
        return { success: true };
    }

    authenticate(req, res, next) {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
        }
        const decoded = this.verifyToken(auth.slice(7));
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
        }
        req.user = decoded.body;
        next();
    }

    requireRole(...roles) {
        return (req, res, next) => {
            if (!req.user) return res.status(401).json({ error: 'Not authenticated', code: 'NO_TOKEN' });
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
            }
            next();
        };
    }

    getStats() {
        return {
            activeRefreshTokens: this.refreshTokens.size,
            blacklistedTokens: this.blacklistedTokens.size,
            totalUsers: this.users.size,
            tokenExpiry: this.tokenExpiry,
            refreshExpiry: this.refreshExpiry,
            maxLoginAttempts: this.maxLoginAttempts,
            lockoutMinutes: this.lockoutMinutes,
            loginAttemptsTracked: this.loginAttempts.size
        };
    }
}

module.exports = { AuthManager };

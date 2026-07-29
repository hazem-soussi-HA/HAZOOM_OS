const https = require('https');
const fs = require('fs');
const express = require('express');
const path = require('path');

const app = express();
const PORT = 8443;

// Enhanced security headers
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "connect-src 'self' wss:; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "frame-ancestors 'none'"
    );
    next();
});

app.use(express.static(path.join(__dirname)));

const httpsOptions = {
    key: fs.readFileSync('/home/hazem/map-data/ssl/server.key'),
    cert: fs.readFileSync('/home/hazem/map-data/ssl/server.crt')
};

https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`🚀 Enhanced Secure Map Server running on https://localhost:${PORT}`);
    console.log('🔒 Security: CSP, HSTS, XSS Protection Active');
});

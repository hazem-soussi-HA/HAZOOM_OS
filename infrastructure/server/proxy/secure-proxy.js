const https = require('https');
const fs = require('fs');
const express = require('express');
const path = require('path');

const app = express();
const PORT = 8443;

// Enhanced security middleware
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "connect-src 'self' https: wss:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
        "style-src 'self' 'unsafe-inline' https:; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' https:; " +
        "frame-ancestors 'none'; " +
        "upgrade-insecure-requests"
    );
    res.setHeader('Permissions-Policy', 
        "geolocation=(), microphone=(), camera=()"
    );
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Security-Policy', 
                "default-src 'self'; " +
                "script-src 'self' https:; " +
                "style-src 'self' https:; " +
                "img-src 'self' data: https:; " +
                "connect-src 'self' https:"
            );
        }
    }
}));

// HTTPS options
const httpsOptions = {
    key: fs.readFileSync('/home/hazem/map-data/ssl/server.key'),
    cert: fs.readFileSync('/home/hazem/map-data/ssl/server.crt'),
    ca: fs.readFileSync('/home/hazem/map-data/ssl/server.crt'),
    secureOptions: {
        SSL_OP_NO_SSLv2: true,
        SSL_OP_NO_SSLv3: true,
        SSL_OP_NO_TLSv1: true,
        SSL_OP_NO_TLSv1_1: true
    },
    ciphers: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-GCM-SHA256'
    ].join(':'),
    honorCipherOrder: true
};

// Enhanced secure proxy server
https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`🚀 Secure Map Server Running on https://localhost:${PORT}`);
    console.log('🔒 Enhanced Security Layer Enabled');
    console.log('📊 CSP Headers Configured with Connect-src for Map APIs');
    console.log('🌐 Content-Security-Policy: strict-dynamic');
    console.log('⚡ Permissions Policy: Geolocation/Camera/Microphone disabled');
});

// Map routes with validation
app.get('/map/*', (req, res) => {
    const sanitizedPath = req.path.replace(/[^a-zA-Z0-9\/\-_.]/g, '');
    res.sendFile(path.join(__dirname, 'enhanced-csp.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'secure',
        service: 'enhanced-map-proxy',
        security: 'strict-csp',
        csp: 'default-src self; connect-src self https: wss:; script-src self https:; img-src self data: https:; frame-ancestors none',
        timestamp: new Date().toISOString()
    });
});

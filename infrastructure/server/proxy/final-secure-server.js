const https = require('https');
const fs = require('fs');
const express = require('express');
const path = require('path');

const app = express();
const PORT = 8443;

// Ultimate security configuration
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
        "font-src 'self' https:; " +
        "frame-ancestors 'none'; " +
        "upgrade-insecure-requests"
    );
    res.setHeader('Permissions-Policy', 
        "geolocation=(), camera=(), microphone=(), payment=()"
    );
    next();
});

app.use(express.static(path.join(__dirname)));

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
        'TLS_AES_128_GCM_SHA256'
    ].join(':'),
    honorCipherOrder: true
};

https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log('🚀 Secure Map Server Running on https://localhost:8443');
    console.log('🔒 Security: CSP+HSTS+XSS Protection');
    console.log('🌐 Live Map: futuristic-map.html');
});

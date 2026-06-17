
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3333;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
    console.log(`Request: ${req.url}`);

    // Handle simple path normalization
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // Remove query strings
    filePath = filePath.split('?')[0];

    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                console.log(`404: ${filePath}`);
                res.writeHead(404);
                res.end('File not found: ' + filePath);
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });

}).listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

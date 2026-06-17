#!/usr/bin/env node
/**
 * Web Server for MCP Inspector
 * 
 * Copyright (c) Hazem Soussi
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8081;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(PUBLIC_DIR, pathname);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  const ext = path.parse(filePath).ext;
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log('\x1b[33m%s\x1b[0m', '=========================================');
  console.log('\x1b[33m%s\x1b[0m', '    MCP Inspector Web Interface');
  console.log('\x1b[33m%s\x1b[0m', '    Copyright (c) Hazem Soussi');
  console.log('\x1b[33m%s\x1b[0m', '=========================================');
  console.log('\x1b[36m%s\x1b[0m', `Server running at http://localhost:${PORT}/`);
  console.log('\x1b[36m%s\x1b[0m', 'Press Ctrl+C to stop the server');
});
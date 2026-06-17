@echo off
REM Web Server Launcher for MCP Inspector
REM Copyright (c) Hazem Soussi

echo Starting MCP Inspector Web Interface on port 8081...
echo.

set PORT=8081
node web\server.js
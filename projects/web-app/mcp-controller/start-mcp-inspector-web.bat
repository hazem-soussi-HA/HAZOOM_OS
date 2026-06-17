@echo off
REM Master launcher for MCP Inspector Web Interface
REM Copyright (c) Hazem Soussi

echo =========================================
echo    MCP Inspector Web Interface
echo    Copyright (c) Hazem Soussi
echo =========================================
echo.

echo Starting MCP Inspector Web Interface on port 8081...
cd mcp-inspector
set PORT=8081
start http://localhost:8081
node web\server.js
@echo off
REM Setup script for Python MCP Server

echo Installing Python dependencies...
pip install -r requirements.txt

if %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies
    exit /b %ERRORLEVEL%
)

echo Starting Python MCP Server...
python mcp_server.py
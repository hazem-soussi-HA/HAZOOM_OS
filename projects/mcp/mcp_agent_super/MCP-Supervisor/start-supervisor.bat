@echo off
echo Starting MCP Supervisor...
call mcp-venv\Scripts\activate.bat
python supervisor.py
pause

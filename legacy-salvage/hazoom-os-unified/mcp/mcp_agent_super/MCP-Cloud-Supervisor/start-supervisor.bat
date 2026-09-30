@echo off
echo Starting Cloud MCP Supervisor...
call mcp-venv\Scripts\activate.bat
python cloud_supervisor.py
pause

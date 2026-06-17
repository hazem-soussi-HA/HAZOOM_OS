#!/bin/bash
echo "🚀 Starting HAZOOM OS - MCP Protocol..."
cd /home/hazem/hazoom
./src/hazoom > /tmp/hazoom-mcp.log 2>&1 &
echo "✅ MCP Server: http://127.0.0.1:3000"
echo "📝 Logs: /tmp/hazoom-mcp.log"
sleep 2
curl -s http://127.0.0.1:3000/api/mcp
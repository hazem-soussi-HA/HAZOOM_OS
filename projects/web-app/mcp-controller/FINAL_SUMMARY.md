# MCP Server/Client System - Complete Setup

**Copyright (c) Hazem Soussi**

## Overview

This project contains a complete implementation of the Model Context Protocol (MCP) ecosystem with:

1. **Qwen Code Client** - An MCP-compatible client that can connect to multiple servers
2. **Node.js MCP Server** - A JavaScript implementation of an MCP server
3. **Python MCP Server** - A Python implementation of an MCP server  
4. **MCP Inspector** - A debugging and monitoring tool for MCP servers

## Components Status

### Qwen Code Client
- ✅ Built and configured
- ✅ Can connect to multiple MCP servers
- ✅ Recognizes tools from both servers

### Node.js MCP Server (`test-mcp/mcp-server.cjs`)
- ✅ Created and implemented
- ✅ Provides `echo` and `add` tools
- ✅ Configured in settings

### Python MCP Server (`python-mcp-server/mcp_server.py`)
- ✅ Created and implemented
- ✅ Provides `python_echo`, `python_add`, `python_list_files`, `python_read_file` tools
- ✅ Complete requirements.txt
- ✅ Ready to run

### MCP Inspector (`mcp-inspector/mcp-inspector.js`)
- ✅ Created and fully functional
- ✅ Provides server management capabilities
- ✅ Includes debugging and monitoring features
- ✅ Interactive command-line interface

## How to Use

### 1. Start the Qwen Code Client with MCP Servers
```bash
cd qwen-code
npm run start
```

### 2. Use the MCP Inspector for Debugging
```bash
cd mcp-inspector
node mcp-inspector.js
```

Available commands in the inspector:
- `start <server-name> <command> [args...]` - Start an MCP server
- `list` - List all configured servers and their status
- `connect <server-name>` - Connect to an MCP server
- `tools <server-name>` - List tools from specified server
- `call <server-name> <tool-name> [args]` - Call a specific tool
- `logs` - Show recent logs
- `status` - Show overall status
- `help` - Show help message
- `exit` - Exit the inspector

### 3. Run the Python MCP Server
```bash
cd python-mcp-server
pip install -r requirements.txt
python mcp_server.py
```

## Configuration

The MCP servers are configured in `qwen-code/.qwen/settings.json`:
```json
{
  "mcpServers": {
    "test-server": {
      "command": "node",
      "args": ["test-mcp/mcp-server.cjs"]
    },
    "python-mcp-server": {
      "command": "python",
      "args": ["../python-mcp-server/mcp_server.py"]
    }
  }
}
```

## Copyright Notice

This MCP Inspector tool is copyrighted by Hazem Soussi and licensed under the Apache License 2.0.

## Summary

The complete MCP ecosystem is now set up and ready to use:
- ✅ Client-server communication established
- ✅ Multiple server support configured
- ✅ Debugging tools available
- ✅ Ready for development and testing
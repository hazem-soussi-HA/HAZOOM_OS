# MCP Inspector

**Copyright (c) Hazem Soussi**

A comprehensive tool for inspecting, debugging, and monitoring MCP (Model Context Protocol) servers.

## Overview

The MCP Inspector is a debugging and monitoring tool designed to help developers work with Model Context Protocol servers. It provides a command-line interface to start, connect to, and interact with MCP servers, as well as inspect the communication between clients and servers.

## Features

- Start and manage MCP servers
- Connect to MCP servers
- List available tools from servers
- Call specific tools with parameters
- Monitor server logs and communication
- View server status and connection information
- Includes a sample MCP server for testing and development

## Requirements

- Node.js 14 or higher

## Installation

No installation required - the inspector is a standalone Node.js script.

## Usage

To start the MCP Inspector (interactive mode):

```bash
node mcp-inspector.js
```

Or if you have npm installed:

```bash
npm start
```

The inspector provides an interactive command-line interface. Once started, you'll see a prompt where you can enter commands.

For a quick test without interactive mode:

```bash
node -e "import('./mcp-inspector.js').then(m => { if (m.default) { const inspector = new m.default(); inspector.start(); } });"
```

## Commands

Once the inspector is running, you can use the following commands:

- `start <server-name> <command> [args...]` - Start an MCP server
- `list` - List all configured servers and their status
- `connect <server-name> - Connect to an MCP server
- `tools <server-name>` - List tools from specified server
- `call <server-name> <tool-name> [args]` - Call a specific tool
- `logs` - Show recent logs
- `status` - Show overall status
- `help` - Show help message
- `exit` - Exit the inspector

## Integrated Sample MCP Server

This distribution includes a sample MCP server implementation for testing and development purposes:

- **File**: `sample-mcp-server.js`
- **Purpose**: Demonstrates MCP protocol implementation
- **Tools included**: 
  - `echo` - Echoes back input text
  - `calculate` - Performs basic mathematical operations
  - `list-files` - Lists files in a directory (mock implementation)

To start the sample MCP server directly:

```bash
node sample-mcp-server.js
```

Or use the batch file on Windows:

```bash
start-sample-mcp-server.bat
```

## Examples

```bash
# Start the inspector
node mcp-inspector.js

# Start the sample MCP server from within the inspector
start sample-server node sample-mcp-server.js

# Connect to the server
connect sample-server

# List available tools
tools sample-server

# Call a specific tool
call sample-server echo '{"text": "Hello, MCP!"}'

# Call the calculate tool
call sample-server calculate '{"operation": "add", "a": 5, "b": 3}'
```

## Copyright

This tool is copyrighted by Hazem Soussi and licensed under the Apache License 2.0.
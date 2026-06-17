# MCP (Model Context Protocol) Server/Client System

This project contains a complete setup for MCP (Model Context Protocol) servers and clients with an inspector tool, developed by Hazem Soussi.

## Project Structure

- `qwen-code/` - The main Qwen Code client that can connect to MCP servers
- `python-mcp-server/` - A Python implementation of an MCP server
- `test-mcp/` - A Node.js implementation of an MCP server
- `mcp-inspector/` - An inspection and debugging tool for MCP servers

## Components

### 1. Qwen Code Client
A CLI tool that can connect to multiple MCP servers and use their tools during AI conversations.

### 2. Python MCP Server
A Python-based MCP server with the following tools:
- `python_echo` - Echoes back input text
- `python_add` - Adds two numbers
- `python_list_files` - Lists files in a directory
- `python_read_file` - Reads file contents

### 3. Node.js MCP Server
A Node.js-based MCP server with the following tools:
- `echo` - Echoes back input text
- `add` - Adds two numbers

### 4. MCP Inspector
A debugging and monitoring tool for MCP servers with the following capabilities:
- Start and manage MCP servers
- Connect to MCP servers
- List available tools from servers
- Call specific tools with parameters
- Monitor server logs and communication
- View server status and connection information

## Setup Instructions

### Prerequisites
- Node.js 14+ for the client and Node.js server
- Python 3.8+ for the Python server
- npm package manager

### 1. Setting up the Qwen Code Client

```bash
cd qwen-code
npm install
npm run build
```

### 2. Setting up the Python MCP Server

```bash
cd python-mcp-server
pip install -r requirements.txt
```

### 3. Setting up the MCP Inspector

The inspector is ready to use as a standalone Node.js script.

## Usage

### Running the Qwen Code Client with MCP Servers

The client is configured to connect to both the Node.js and Python MCP servers. You can start it with:

```bash
cd qwen-code
npm run start
```

### Using the MCP Inspector

```bash
cd mcp-inspector
node mcp-inspector.js
```

Or use the batch file:

```bash
cd mcp-inspector
start-inspector.bat
```

### Available Commands in the Inspector

- `start <server-name> <command> [args...]` - Start an MCP server
- `list` - List all configured servers and their status
- `connect <server-name>` - Connect to an MCP server
- `tools <server-name>` - List tools from specified server
- `call <server-name> <tool-name> [args]` - Call a specific tool
- `logs` - Show recent logs
- `status` - Show overall status
- `help` - Show help message
- `exit` - Exit the inspector

## Configuration

The MCP servers are configured in `qwen-code/.qwen/settings.json` and will automatically connect when the client starts.

## Copyright

This project includes components copyrighted by Hazem Soussi, including the MCP Inspector tool.
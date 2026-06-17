# Python MCP (Model Context Protocol) Server

This is a complete implementation of an MCP server in Python that can be used with Qwen Code or other MCP-compatible clients.

## Overview

The Model Context Protocol (MCP) allows AI models to access external tools and resources. This Python implementation provides several example tools:

- `python_echo`: Echoes back input text
- `python_add`: Adds two numbers
- `python_list_files`: Lists files in a directory
- `python_read_file`: Reads the contents of a file

## Requirements

- Python 3.8 or higher
- pip

## Installation

1. Install the required Python packages:

```bash
pip install -r requirements.txt
```

## Running the Server

To start the server, run:

```bash
python mcp_server.py
```

## Integration with Qwen Code

To use this server with Qwen Code, add the following configuration to your `.qwen/settings.json`:

```json
{
  "mcpServers": {
    "python-mcp-server": {
      "command": "python",
      "args": ["path/to/mcp_server.py"]
    }
  }
}
```

Replace `path/to/mcp_server.py` with the actual path to this file.

## Protocol Implementation

This server implements the following MCP methods:
- `initialize`: Initialize the connection
- `tools/list`: List available tools
- `tools/call`: Execute a tool call

## Tools Available

1. **python_echo**
   - Description: Echoes back the input text
   - Parameters: `text` (string)

2. **python_add**
   - Description: Adds two numbers
   - Parameters: `a` (number), `b` (number)

3. **python_list_files**
   - Description: Lists files in a directory
   - Parameters: `path` (string)

4. **python_read_file**
   - Description: Reads the contents of a file
   - Parameters: `path` (string)
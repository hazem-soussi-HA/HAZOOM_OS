# MCP Inspector Web Interface

**Copyright (c) Hazem Soussi**

A web-based interface for inspecting, debugging, and monitoring MCP (Model Context Protocol) servers.

## Overview

The MCP Inspector Web Interface provides a browser-based graphical user interface to interact with Model Context Protocol servers. It offers a visual alternative to the command-line interface, making it easier to monitor server status, inspect communications, and manage MCP server connections.

## Features

- **Web-based Dashboard**: Visual interface for monitoring MCP servers
- **Real-time Monitoring**: View server status and communication logs in real-time
- **Tool Browsing**: List and inspect available tools from connected MCP servers
- **Interactive Tool Calls**: Execute server tools directly from the web interface
- **Connection Management**: Start, stop, and manage connections to MCP servers
- **Log Visualization**: View formatted server logs and communication data
- **Responsive Design**: Works on desktop and mobile devices

## Requirements

- Node.js 14 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

No installation required - the web interface is a standalone Node.js server.

## Usage

To start the web server:

```bash
node web/server.js
```

The web interface will be available at http://localhost:8081/

Alternatively, you can use the provided batch file (on Windows):

```bash
start-web-inspector.bat
```

## Server Configuration

The web server runs on port 8081 by default. You can change the port by setting the PORT environment variable:

```bash
PORT=3000 node web/server.js
```

## Features

### Dashboard
- Overview of all configured MCP servers
- Status indicators for each server
- Quick access to server management functions

### Server Management
- Start new MCP servers
- Connect to existing MCP servers
- View server details and connection status
- Monitor server health and performance

### Tool Explorer
- Browse all available tools from connected servers
- View tool parameters and descriptions
- Execute tools with custom parameters
- See tool execution results

### Log Viewer
- Real-time display of server logs
- Filter logs by severity level
- Search through historical log data
- Export logs for analysis

## Integration with Sample MCP Server

The web interface works seamlessly with the included sample MCP server (`sample-mcp-server.js`), which provides:
- `echo` tool - Echoes back input text
- `calculate` tool - Performs basic mathematical operations
- `list-files` tool - Lists files in a directory (mock implementation)

## Development

The web interface is built with vanilla HTML, CSS, and JavaScript. To extend functionality:

1. Modify `index.html` for UI changes
2. Update CSS files for styling
3. Enhance JavaScript for new features
4. Restart the server to see changes

## Troubleshooting

### Server won't start
- Ensure Node.js is installed and accessible from command line
- Check that port 8081 is not in use by another application

### Page not loading
- Verify the server is running and accessible at http://localhost:8081/
- Check browser console for errors
- Ensure all web assets (HTML, CSS, JS) are in the correct directory

### Connection issues
- Verify MCP servers are running and accessible
- Check network connectivity between inspector and target servers
- Review server configuration and authentication settings

## Integration with MCP Protocol

The web interface communicates with MCP servers using the standard Model Context Protocol. It supports:
- Discovery of available MCP servers
- Tool registration and discovery
- Parameter validation and type checking
- Secure communication channels

## Security Considerations

- The web interface should only be accessible on trusted networks
- Authentication and authorization should be implemented for production use
- Communication with MCP servers should use secure connections when possible

## Copyright

This tool is copyrighted by Hazem Soussi and licensed under the Apache License 2.0.
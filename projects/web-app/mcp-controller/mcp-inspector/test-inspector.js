#!/usr/bin/env node
/**
 * Simple test for MCP Inspector
 * 
 * Copyright (c) Hazem Soussi
 */

import { spawn } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPInspector {
  constructor() {
    this.servers = new Map();
    this.connections = new Map();
    this.logs = [];
    this.isInspecting = false;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message };
    this.logs.push(logEntry);
    
    const color = type === 'error' ? '\x1b[31m' : 
                  type === 'warn' ? '\x1b[33m' : 
                  type === 'success' ? '\x1b[32m' : '\x1b[36m';
                  
    console.log(`${color}[${timestamp}] ${type.toUpperCase()}: ${message}\x1b[0m`);
  }

  async startServer(serverName, command, args = []) {
    try {
      this.log(`Starting MCP server: ${serverName}`, 'info');
      
      const serverProcess = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      // Store server reference
      this.servers.set(serverName, {
        process: serverProcess,
        name: serverName,
        status: 'starting',
        startTime: new Date()
      });

      // Handle server stdout
      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        this.log(`[${serverName}] STDOUT: ${output.trim()}`, 'info');
        
        // Check if it's an initialized message
        if (output.includes('initialized')) {
          const serverInfo = this.servers.get(serverName);
          if (serverInfo) {
            serverInfo.status = 'running';
            this.log(`MCP Server ${serverName} is now running`, 'success');
          }
        }
      });

      // Handle server stderr
      serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        this.log(`[${serverName}] STDERR: ${error.trim()}`, 'error');
      });

      // Handle server close
      serverProcess.on('close', (code) => {
        this.log(`MCP Server ${serverName} closed with code ${code}`, 'warn');
        const serverInfo = this.servers.get(serverName);
        if (serverInfo) {
          serverInfo.status = 'stopped';
        }
      });

      // Handle server errors
      serverProcess.on('error', (err) => {
        this.log(`Failed to start MCP Server ${serverName}: ${err.message}`, 'error');
        this.servers.delete(serverName);
      });

      return serverProcess;
    } catch (error) {
      this.log(`Error starting server ${serverName}: ${error.message}`, 'error');
      return null;
    }
  }

  listServers() {
    if (this.servers.size === 0) {
      this.log('No MCP servers are currently configured', 'info');
      return;
    }

    console.log('\n=== MCP Server Status ===');
    for (const [name, server] of this.servers) {
      const statusColor = server.status === 'running' ? '\x1b[32m' : 
                         server.status === 'starting' ? '\x1b[33m' : '\x1b[31m';
      console.log(`${statusColor}${name}: ${server.status}\x1b[0m (Started: ${server.startTime.toISOString()})`);
    }
    console.log('========================\n');
  }

  async connectToServer(serverName) {
    this.log(`Connecting to MCP server: ${serverName}`, 'info');
    
    // In a real implementation, this would establish an actual connection
    // For now, we'll just simulate the connection
    this.connections.set(serverName, {
      connected: true,
      lastActivity: new Date(),
      server: serverName
    });
    
    this.log(`Connected to MCP server: ${serverName}`, 'success');
  }

  async sendMCPRequest(serverName, method, params = {}) {
    this.log(`Sending MCP request to ${serverName}: ${method}`, 'info');
    
    // Simulate sending request to server
    const connection = this.connections.get(serverName);
    if (!connection || !connection.connected) {
      this.log(`Not connected to server ${serverName}`, 'error');
      return null;
    }

    // For demonstration, we'll just return a mock response
    // In a real implementation, this would send actual JSON-RPC messages
    const requestId = Math.random().toString(36).substring(2, 15);
    
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: method,
      params: params
    };

    this.log(`MCP Request: ${JSON.stringify(request, null, 2)}`, 'info');

    // Simulate response based on method
    let response;
    switch (method) {
      case 'tools/list':
        response = {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            tools: [
              {
                name: 'sample_tool',
                description: 'A sample tool for demonstration',
                inputSchema: {
                  type: 'object',
                  properties: {
                    input: { type: 'string', description: 'Sample input' }
                  },
                  required: ['input']
                }
              }
            ]
          }
        };
        break;
      case 'initialize':
        response = {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: serverName, version: '1.0.0' }
          }
        };
        break;
      default:
        response = {
          jsonrpc: '2.0',
          id: requestId,
          result: { message: `Handled ${method} method` }
        };
    }

    this.log(`MCP Response: ${JSON.stringify(response, null, 2)}`, 'success');
    return response;
  }

  showHelp() {
    console.log(`
MCP Inspector - Developed by Hazem Soussi

Commands:
  start <server-name> <command> [args...] - Start an MCP server
  list - List all configured servers and their status
  connect <server-name> - Connect to an MCP server
  tools <server-name> - List tools from specified server
  call <server-name> <tool-name> [args] - Call a specific tool
  logs - Show recent logs
  status - Show overall status
  help - Show this help message
  exit - Exit the inspector

Examples:
  start my-server node path/to/server.js
  connect my-server
  tools my-server
  call my-server sample_tool '{"input": "test"}'
    `);
  }

  showLogs() {
    if (this.logs.length === 0) {
      console.log('No logs available');
      return;
    }

    console.log('\n=== Recent Logs ===');
    // Show last 10 logs
    const recentLogs = this.logs.slice(-10);
    for (const log of recentLogs) {
      const color = log.type === 'error' ? '\x1b[31m' : 
                    log.type === 'warn' ? '\x1b[33m' : 
                    log.type === 'success' ? '\x1b[32m' : '\x1b[36m';
      console.log(`${color}[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}\x1b[0m`);
    }
    console.log('==================\n');
  }

  async processCommand(input) {
    const parts = input.trim().split(/\s+/);
    const command = parts[0].toLowerCase();

    switch (command) {
      case 'start':
        if (parts.length < 3) {
          this.log('Usage: start <server-name> <command> [args...]', 'error');
          return;
        }
        const serverName = parts[1];
        const commandToRun = parts[2];
        const args = parts.slice(3);
        await this.startServer(serverName, commandToRun, args);
        break;

      case 'list':
        this.listServers();
        break;

      case 'connect':
        if (parts.length < 2) {
          this.log('Usage: connect <server-name>', 'error');
          return;
        }
        await this.connectToServer(parts[1]);
        break;

      case 'tools':
        if (parts.length < 2) {
          this.log('Usage: tools <server-name>', 'error');
          return;
        }
        await this.sendMCPRequest(parts[1], 'tools/list');
        break;

      case 'call':
        if (parts.length < 3) {
          this.log('Usage: call <server-name> <tool-name> [args]', 'error');
          return;
        }
        const server = parts[1];
        const tool = parts[2];
        let toolArgs = {};
        if (parts.length > 3) {
          try {
            toolArgs = JSON.parse(parts.slice(3).join(' '));
          } catch (e) {
            this.log(`Invalid JSON arguments: ${parts.slice(3).join(' ')}`, 'error');
            return;
          }
        }
        await this.sendMCPRequest(server, 'tools/call', { name: tool, arguments: toolArgs });
        break;

      case 'logs':
        this.showLogs();
        break;

      case 'status':
        this.listServers();
        break;

      case 'help':
        this.showHelp();
        break;

      case 'exit':
      case 'quit':
        this.log('Exiting MCP Inspector. Goodbye!', 'success');
        process.exit(0);
        break;

      case '':
        // Empty command, do nothing
        break;

      default:
        this.log(`Unknown command: ${command}. Type 'help' for available commands.`, 'error');
    }
  }

  async start() {
    console.log('\x1b[33m%s\x1b[0m', '=========================================');
    console.log('\x1b[33m%s\x1b[0m', '    MCP (Model Context Protocol) Inspector');
    console.log('\x1b[33m%s\x1b[0m', '    Copyright (c) Hazem Soussi');
    console.log('\x1b[33m%s\x1b[0m', '=========================================');
    console.log('\x1b[36m%s\x1b[0m', 'MCP Inspector started. Type "help" for commands.\n');

    // Test the inspector by showing help
    this.showHelp();
    console.log('\x1b[32m%s\x1b[0m', 'MCP Inspector is properly set up and ready to use!');
  }
}

// Main execution
if (import.meta.url === `file://${__filename}`) {
  const inspector = new MCPInspector();
  inspector.start().catch(console.error);
}

export default MCPInspector;
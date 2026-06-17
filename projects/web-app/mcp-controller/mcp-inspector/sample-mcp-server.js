#!/usr/bin/env node
/**
 * Sample MCP (Model Context Protocol) Server
 * 
 * Copyright (c) Hazem Soussi
 * Licensed under the Apache License 2.0
 * 
 * A simple implementation of an MCP server for demonstration purposes.
 */

import { createServer } from 'net';
import readline from 'readline';
import crypto from 'crypto';

class SampleMCPServer {
  constructor(port = 8082) {
    this.port = port;
    this.clients = new Set();
    this.tools = {
      'echo': {
        name: 'echo',
        description: 'Echoes back the input text',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text to echo' }
          },
          required: ['text']
        }
      },
      'calculate': {
        name: 'calculate',
        description: 'Performs basic mathematical calculations',
        inputSchema: {
          type: 'object',
          properties: {
            operation: { type: 'string', enum: ['add', 'subtract', 'multiply', 'divide'], description: 'Operation to perform' },
            a: { type: 'number', description: 'First operand' },
            b: { type: 'number', description: 'Second operand' }
          },
          required: ['operation', 'a', 'b']
        }
      },
      'list-files': {
        name: 'list-files',
        description: 'Lists files in the current directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path to list (default: current directory)' }
          }
        }
      }
    };
    this.server = null;
  }

  // Generate a random ID for JSON-RPC requests
  generateId() {
    return crypto.randomBytes(8).toString('hex');
  }

  // Send a JSON-RPC response
  sendResponse(socket, id, result, error = null) {
    const response = {
      jsonrpc: '2.0',
      id: id
    };

    if (error) {
      response.error = error;
    } else {
      response.result = result;
    }

    const jsonString = JSON.stringify(response);
    socket.write(`Content-Length: ${Buffer.byteLength(jsonString, 'utf8')}\r\n\r\n${jsonString}`);
  }

  // Send a JSON-RPC notification
  sendNotification(socket, method, params) {
    const notification = {
      jsonrpc: '2.0',
      method: method,
      params: params
    };

    const jsonString = JSON.stringify(notification);
    socket.write(`Content-Length: ${Buffer.byteLength(jsonString, 'utf8')}\r\n\r\n${jsonString}`);
  }

  // Handle MCP requests
  async handleRequest(socket, jsonData) {
    try {
      const request = JSON.parse(jsonData);
      const { id, method, params } = request;

      console.log(`Received request: ${method}`);

      switch (method) {
        case 'initialize':
          const initializeResult = {
            protocolVersion: '2024-11-05',
            capabilities: { 
              tools: {},
              logging: {}
            },
            serverInfo: { 
              name: 'SampleMCP', 
              version: '1.0.0' 
            }
          };
          this.sendResponse(socket, id, initializeResult);
          break;

        case 'tools/list':
          const toolsList = {
            tools: Object.values(this.tools)
          };
          this.sendResponse(socket, id, toolsList);
          break;

        case 'tools/call':
          const { name, arguments: args } = params;
          let result = null;
          let error = null;

          if (!this.tools[name]) {
            error = {
              code: -32601,
              message: `Method '${name}' not found`
            };
          } else {
            try {
              result = await this.executeTool(name, args);
            } catch (toolError) {
              error = {
                code: -32603,
                message: toolError.message
              };
            }
          }

          this.sendResponse(socket, id, result, error);
          break;

        case 'ping':
          this.sendResponse(socket, id, { message: 'pong' });
          break;

        default:
          this.sendResponse(socket, id, null, {
            code: -32601,
            message: `Method '${method}' not found`
          });
      }
    } catch (error) {
      console.error('Error handling request:', error);
    }
  }

  // Execute a specific tool
  async executeTool(toolName, args) {
    switch (toolName) {
      case 'echo':
        return { text: args.text || 'No text provided' };
      
      case 'calculate':
        const { operation, a, b } = args;
        let result;

        switch (operation) {
          case 'add':
            result = a + b;
            break;
          case 'subtract':
            result = a - b;
            break;
          case 'multiply':
            result = a * b;
            break;
          case 'divide':
            if (b === 0) {
              throw new Error('Division by zero');
            }
            result = a / b;
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }

        return { result, operation, a, b };

      case 'list-files':
        // This is a simplified implementation - in a real server, you'd use fs module
        // For demo purposes, we'll return a mock list
        return {
          files: [
            'file1.txt',
            'file2.json',
            'config.js'
          ],
          directory: args.path || './'
        };

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  // Start the MCP server
  start() {
    this.server = createServer((socket) => {
      console.log('New client connected');
      this.clients.add(socket);

      const rl = readline.createInterface({
        input: socket,
        crlfDelay: Infinity
      });

      let contentLength = 0;
      let buffer = '';

      rl.on('line', (line) => {
        if (line === '\r' || line === '') {
          // End of headers, start reading body
          if (contentLength > 0) {
            // Body will be read in the next chunks
            return;
          }
        } else if (line.startsWith('Content-Length:')) {
          contentLength = parseInt(line.split(':')[1].trim(), 10);
        } else {
          buffer += line + '\n';
        }
      });

      socket.on('data', (data) => {
        buffer += data.toString();

        // Look for the end of headers (\r\n\r\n)
        const headerEndIndex = buffer.indexOf('\r\n\r\n');
        if (headerEndIndex !== -1) {
          const headers = buffer.substring(0, headerEndIndex);
          const bodyStartIndex = headerEndIndex + 4;
          const body = buffer.substring(bodyStartIndex);

          // If we have the full body
          if (body.length >= contentLength) {
            const jsonData = body.substring(0, contentLength);
            this.handleRequest(socket, jsonData);
            buffer = body.substring(contentLength);
          }
        }
      });

      socket.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(socket);
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
    });

    this.server.listen(this.port, () => {
      console.log(`Sample MCP Server listening on port ${this.port}`);
      console.log('Ready to accept MCP connections...');
    });

    this.server.on('error', (err) => {
      console.error('Server error:', err);
    });
  }

  // Stop the server
  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('MCP Server closed');
      });
    }

    // Close all client connections
    for (const socket of this.clients) {
      socket.destroy();
    }
    this.clients.clear();
  }
}

// Main execution
if (import.meta.url === `file://${new URL(import.meta.url).pathname}`) {
  const server = new SampleMCPServer();
  
  console.log('=========================================');
  console.log('    Sample MCP Server');
  console.log('    Copyright (c) Hazem Soussi');
  console.log('=========================================');
  
  server.start();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down MCP server...');
    server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down MCP server...');
    server.stop();
    process.exit(0);
  });
}

export default SampleMCPServer;
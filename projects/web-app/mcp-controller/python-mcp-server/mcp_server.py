#!/usr/bin/env python3
"""
Python MCP (Model Context Protocol) Server
This server implements the Model Context Protocol to provide tools to AI models.
"""

import asyncio
import json
import sys
import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from jsonrpcserver import method, Success, Error
from jsonrpcserver.async_dispatcher import dispatch
import anyio


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ToolCallRequest(BaseModel):
    name: str
    arguments: Dict[str, Any]


class ToolResponse(BaseModel):
    content: list


@method
async def initialize(params: Dict[str, Any]) -> Dict[str, Any]:
    """Initialize the MCP server."""
    logger.info("Initializing MCP server")
    return {
        "protocolVersion": "2024-11-05",
        "capabilities": {
            "tools": {}
        },
        "serverInfo": {
            "name": "python-mcp-server",
            "version": "1.0.0"
        }
    }


@method
async def tools_list(params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """List available tools."""
    logger.info("Listing tools")
    tools = [
        {
            "name": "python_echo",
            "description": "Echo back the input text",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Text to echo back"}
                },
                "required": ["text"]
            }
        },
        {
            "name": "python_add",
            "description": "Add two numbers",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "a": {"type": "number", "description": "First number"},
                    "b": {"type": "number", "description": "Second number"}
                },
                "required": ["a", "b"]
            }
        },
        {
            "name": "python_list_files",
            "description": "List files in a directory",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Directory path to list"}
                },
                "required": ["path"]
            }
        },
        {
            "name": "python_read_file",
            "description": "Read the contents of a file",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File path to read"}
                },
                "required": ["path"]
            }
        }
    ]
    return {"tools": tools}


@method
async def tools_call(params: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a tool call."""
    logger.info(f"Tool call: {params}")
    name = params.get("name")
    arguments = params.get("arguments", {})
    
    if name == "python_echo":
        text = arguments.get("text", "")
        result = f"Echo: {text}"
        return {"content": [{"type": "text", "text": result}]}
    
    elif name == "python_add":
        a = arguments.get("a", 0)
        b = arguments.get("b", 0)
        result = a + b
        return {"content": [{"type": "text", "text": str(result)}]}
    
    elif name == "python_list_files":
        import os
        path = arguments.get("path", ".")
        try:
            files = os.listdir(path)
            result = f"Files in {path}: {', '.join(files)}"
            return {"content": [{"type": "text", "text": result}]}
        except Exception as e:
            return {"content": [{"type": "text", "text": f"Error listing files: {str(e)}"}]}
    
    elif name == "python_read_file":
        import os
        path = arguments.get("path", "")
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            return {"content": [{"type": "text", "text": content}]}
        except Exception as e:
            return {"content": [{"type": "text", "text": f"Error reading file: {str(e)}"}]}
    
    else:
        return {"content": [{"type": "text", "text": f"Unknown tool: {name}"}]}


async def main():
    """Main function to run the MCP server."""
    logger.info("Starting Python MCP Server...")
    
    # Send initialized notification
    initialized_msg = {
        "jsonrpc": "2.0",
        "method": "initialized"
    }
    print(json.dumps(initialized_msg), flush=True)
    
    # Process requests from stdin
    try:
        async for line in anyio.streams.TextReceiveStream(sys.stdin):
            if line.strip():
                try:
                    request = json.loads(line.strip())
                    response = await dispatch(request)
                    
                    if hasattr(response, 'data'):
                        response_data = response.data
                    else:
                        response_data = response
                        
                    print(json.dumps(response_data), flush=True)
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON: {line}")
                except Exception as e:
                    logger.error(f"Error processing request: {e}")
                    error_response = {
                        "jsonrpc": "2.0",
                        "id": request.get("id"),
                        "error": {
                            "code": -32603,
                            "message": str(e)
                        }
                    }
                    print(json.dumps(error_response), flush=True)
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
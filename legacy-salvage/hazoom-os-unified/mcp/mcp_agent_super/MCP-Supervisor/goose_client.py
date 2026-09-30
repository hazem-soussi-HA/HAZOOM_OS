#!/usr/bin/env python3
'''
Goose Client - A sample client that can be controlled by the MCP supervisor
'''

import asyncio
import json
import sys
from typing import Dict, Any
from mcp.client import ClientSession
from mcp.client.stdio import stdio_client
from mcp.types import TextContent

class GooseClient:
    def __init__(self):
        self.is_connected = False
        self.session: ClientSession = None
        
    async def connect(self):
        '''Connect to the MCP supervisor'''
        try:
            # Connect via stdio to the supervisor
            self.session = await stdio_client()
            self.is_connected = True
            print("Goose client connected to MCP supervisor")
            return True
        except Exception as e:
            print(f"Failed to connect to MCP supervisor: {e}")
            return False
    
    async def disconnect(self):
        '''Disconnect from the MCP supervisor'''
        if self.session:
            await self.session.close()
            self.is_connected = False
            print("Goose client disconnected from MCP supervisor")
    
    async def send_message(self, message: str) -> str:
        '''Send a message to the supervisor'''
        if not self.is_connected or not self.session:
            return "Not connected to supervisor"
        
        try:
            # Send a notification to the supervisor
            await self.session.send_notification(
                "goose/message",
                params={"content": message}
            )
            return f"Message sent: {message}"
        except Exception as e:
            return f"Failed to send message: {e}"
    
    async def handle_supervisor_command(self, method: str, params: Dict[Any, Any]) -> str:
        '''Handle commands from the supervisor'''
        try:
            if method == "goose/ping":
                return "pong"
            elif method == "goose/execute":
                command = params.get("command", "")
                return await self.execute_command(command)
            elif method == "goose/get_status":
                return json.dumps({
                    "status": "running",
                    "connected": self.is_connected,
                    "version": "1.0.0"
                })
            else:
                return f"Unknown command: {method}"
        except Exception as e:
            return f"Error handling command {method}: {e}"
    
    async def execute_command(self, command: str) -> str:
        '''Execute a goose-specific command'''
        # This is where you would implement actual goose functionality
        # For now, we'll just simulate some responses
        if command == "fly":
            await asyncio.sleep(1)  # Simulate work
            return "Goose is flying!"
        elif command == "honk":
            return "Honk honk!"
        elif command == "swim":
            return "Goose is swimming!"
        elif command == "eat":
            return "Goose is eating!"
        else:
            return f"Unknown command: {command}"

async def main():
    '''Main entry point for the goose client'''
    client = GooseClient()
    
    # Connect to the supervisor
    if not await client.connect():
        print("Failed to connect to supervisor, exiting...")
        return
    
    try:
        # Listen for commands from the supervisor
        async for message in client.session.incoming_messages:
            if message.method:
                # Handle requests from the supervisor
                response = await client.handle_supervisor_command(
                    message.method, 
                    message.params or {}
                )
                if message.id:
                    # Send a response back if this was a request (has an ID)
                    await client.session.send_response(
                        id=message.id,
                        result=response
                    )
    except KeyboardInterrupt:
        print("Goose client interrupted")
    except Exception as e:
        print(f"Goose client error: {e}")
    finally:
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
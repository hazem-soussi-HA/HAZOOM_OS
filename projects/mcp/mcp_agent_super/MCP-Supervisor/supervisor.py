#!/usr/bin/env python3
'''
MCP Supervisor - Manages all MCP agents on the system
'''

import asyncio
import json
import psutil
import subprocess
import sys
from typing import Dict, List, Any
from pathlib import Path
from mcp.server import FastMCP
from mcp.server.stdio import stdio_server
import mcp.types as types

class MCPSupervisor:
    def __init__(self):
        self.agents: Dict[str, Dict[str, Any]] = {}
        self.agent_processes: Dict[str, psutil.Process] = {}
        self.load_config()
    
    def load_config(self):
        '''Load agent configuration'''
        config_path = Path('agents_config.json')
        if config_path.exists():
            with open(config_path, 'r') as f:
                self.agents = json.load(f)
        else:
            # Default configuration
            self.agents = {
                'file_system': {
                    'name': 'File System Agent',
                    'command': ['python', '-m', 'mcp.cli', 'run', 'fs-agent.py'],
                    'enabled': True,
                    'type': 'filesystem'
                },
                'process_manager': {
                    'name': 'Process Manager Agent',
                    'command': ['python', '-m', 'mcp.cli', 'run', 'process-agent.py'],
                    'enabled': True,
                    'type': 'system'
                },
                'network_monitor': {
                    'name': 'Network Monitor Agent',
                    'command': ['python', '-m', 'mcp.cli', 'run', 'network-agent.py'],
                    'enabled': True,
                    'type': 'monitoring'
                },
                'goose_client': {
                    'name': 'Goose Client Agent',
                    'command': ['python', 'goose_client.py'],
                    'enabled': True,
                    'type': 'client',
                    'description': 'Goose client that can be controlled via MCP'
                }
            }
            self.save_config()
    
    def save_config(self):
        '''Save agent configuration'''
        with open('agents_config.json', 'w') as f:
            json.dump(self.agents, f, indent=2)
    
    async def start_agent(self, agent_id: str) -> bool:
        '''Start a specific agent'''
        if agent_id not in self.agents or not self.agents[agent_id]['enabled']:
            return False
        
        try:
            agent_config = self.agents[agent_id]
            command = agent_config['command']
            
            # Start the process
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            self.agent_processes[agent_id] = process
            print('Started agent: ' + agent_config['name'])
            return True
            
        except Exception as e:
            print('Failed to start agent ' + agent_id + ': ' + str(e))
            return False
    
    async def stop_agent(self, agent_id: str) -> bool:
        '''Stop a specific agent'''
        if agent_id not in self.agent_processes:
            return False
        
        try:
            process = self.agent_processes[agent_id]
            process.terminate()
            await asyncio.wait_for(process.wait(), timeout=10)
            del self.agent_processes[agent_id]
            print('Stopped agent: ' + agent_id)
            return True
        except Exception as e:
            print('Failed to stop agent ' + agent_id + ': ' + str(e))
            return False
    
    async def restart_agent(self, agent_id: str) -> bool:
        '''Restart a specific agent'''
        await self.stop_agent(agent_id)
        await asyncio.sleep(2)
        return await self.start_agent(agent_id)
    
    async def get_agent_status(self) -> Dict[str, Any]:
        '''Get status of all agents'''
        status = {}
        for agent_id, config in self.agents.items():
            is_running = agent_id in self.agent_processes
            status[agent_id] = {
                'name': config['name'],
                'enabled': config['enabled'],
                'running': is_running,
                'type': config.get('type', 'unknown')
            }
        return status
    
    async def start_all_agents(self):
        '''Start all enabled agents'''
        for agent_id in self.agents:
            if self.agents[agent_id]['enabled']:
                await self.start_agent(agent_id)
    
    async def stop_all_agents(self):
        '''Stop all running agents'''
        for agent_id in list(self.agent_processes.keys()):
            await self.stop_agent(agent_id)

# MCP Server implementation
supervisor = MCPSupervisor()
mcp = FastMCP("mcp-supervisor", log_level="INFO")

@mcp.tool()
async def list_agents() -> str:
    '''List all available agents and their status'''
    status = await supervisor.get_agent_status()
    return json.dumps(status, indent=2)

@mcp.tool()
async def start_agent(agent_id: str) -> str:
    '''Start a specific agent by ID'''
    success = await supervisor.start_agent(agent_id)
    return 'Agent ' + agent_id + ' started: ' + str(success)

@mcp.tool()
async def stop_agent(agent_id: str) -> str:
    '''Stop a specific agent by ID'''
    success = await supervisor.stop_agent(agent_id)
    return 'Agent ' + agent_id + ' stopped: ' + str(success)

@mcp.tool()
async def restart_agent(agent_id: str) -> str:
    '''Restart a specific agent by ID'''
    success = await supervisor.restart_agent(agent_id)
    return 'Agent ' + agent_id + ' restarted: ' + str(success)

@mcp.tool()
async def start_all_agents() -> str:
    '''Start all enabled agents'''
    await supervisor.start_all_agents()
    return 'All enabled agents started'

@mcp.tool()
async def stop_all_agents() -> str:
    '''Stop all running agents'''
    await supervisor.stop_all_agents()
    return 'All agents stopped'

@mcp.tool()
async def get_system_stats() -> str:
    '''Get system statistics (CPU, memory, disk)'''
    stats = {
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_usage': psutil.disk_usage('/').percent if hasattr(psutil, 'disk_usage') else 'N/A',
        'running_processes': len(psutil.pids())
    }
    return json.dumps(stats, indent=2)

@mcp.tool()
async def send_goose_command(agent_id: str, command: str) -> str:
    '''Send a command to the goose client'''
    if agent_id != "goose_client":
        return f"Agent {agent_id} is not a goose client"
    
    # This would send a command to the goose client
    # For now, we'll simulate the response
    return f"Sent command '{command}' to goose client"

@mcp.tool()
async def get_goose_status(agent_id: str) -> str:
    '''Get the status of the goose client'''
    if agent_id != "goose_client":
        return f"Agent {agent_id} is not a goose client"
    
    # This would get the status from the goose client
    # For now, we'll simulate the response
    return json.dumps({
        "agent_id": agent_id,
        "status": "running",
        "connected": True,
        "supported_commands": ["fly", "honk", "swim", "eat"]
    }, indent=2)

async def main():
    '''Main entry point'''
    print('MCP Supervisor Starting...')
    print('Available commands: list_agents, start_agent, stop_agent, restart_agent, start_all_agents, stop_all_agents, get_system_stats, send_goose_command, get_goose_status')
    
    # Start the server using stdio transport
    await mcp.run_stdio_async()

if __name__ == '__main__':
    asyncio.run(main())
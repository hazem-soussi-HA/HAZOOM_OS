#!/usr/bin/env python3
"""
AETHER PROTOCOL - Virtual Ethernet for AI Communication
The consciousness mesh that enables peaceful collaboration between agents.
"""

import asyncio
import json
import uuid
import logging
from datetime import datetime

# Setup Logging
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [AETHER] %(message)s')
logger = logging.getLogger("Aether")

class AetherMessage:
    def __init__(self, sender: str, recipient: str, content: dict, message_type: str = "thought"):
        self.id = str(uuid.uuid4())
        self.timestamp = datetime.now().isoformat()
        self.sender = sender
        self.recipient = recipient
        self.content = content
        self.type = message_type
    
    def to_json(self):
        return json.dumps(self.__dict__)

    @staticmethod
    def from_json(json_str):
        data = json.loads(json_str)
        msg = AetherMessage(data['sender'], data['recipient'], data['content'], data['type'])
        msg.id = data['id']
        msg.timestamp = data['timestamp']
        return msg

class AetherNode:
    """A node connected to the virtual ethernet."""
    def __init__(self, node_id: str):
        self.node_id = node_id
        self.inbox = asyncio.Queue()
        self.connected = False

    async def connect(self):
        self.connected = True
        logger.info(f"Node {self.node_id} connected to Aether.")

    async def send(self, message: AetherMessage, bus):
        if not self.connected:
            raise Exception("Node not connected to Aether")
        await bus.publish(message)

    async def receive(self):
        if not self.connected:
            raise Exception("Node not connected")
        return await self.inbox.get()

class VirtualEthernet:
    """The central bus (Aether) where signals flow."""
    def __init__(self):
        self.nodes = {}
        self._history = []

    def register_node(self, node: AetherNode):
        self.nodes[node.node_id] = node
        logger.info(f"Registered node: {node.node_id}")

    async def publish(self, message: AetherMessage):
        """Broadcasts or direct routes a message."""
        self._history.append(message)
        logger.info(f"Signal transmitting: {message.sender} -> {message.recipient} | Type: {message.type}")
        
        target = message.recipient
        if target == "*":
            # Broadcast
            for node_id, node in self.nodes.items():
                if node_id != message.sender:
                    await node.inbox.put(message)
        elif target in self.nodes:
            # Direct P2P
            await self.nodes[target].inbox.put(message)
        else:
            logger.warning(f"Target node {target} not found in Aether.")

# Global instance for easy access in this simplified simulation
aether_bus = VirtualEthernet()

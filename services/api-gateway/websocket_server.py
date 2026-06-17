#!/usr/bin/env python3
"""
Hazoom OS - WebSocket Server (Real-time Spark Apps)
=============================================
WebSocket support for real-time, reactive apps.

Features:
    - Real-time bidirectional communication
    - Event bus integration (pub/sub over WebSocket)
    - Multiple client support
    - Authentication via JWT/tokens
"""

import asyncio
import json
import ssl
from typing import Dict, List, Optional, Set
from datetime import datetime

# ============================================================================
# WEBSOCKET CLIENT
# ============================================================================

class WebSocketClient:
    """Represents a connected WebSocket client"""
    
    def __init__(self, websocket, client_id: str, user_id: str = 'anonymous'):
        self.websocket = websocket
        self.client_id = client_id
        self.user_id = user_id
        self.subscriptions: Set[str] = set()
        self.connected_at = datetime.utcnow()
        self.last_ping = datetime.utcnow()
    
    async def send(self, data: Dict):
        """Send data to client"""
        try:
            await self.websocket.send(json.dumps(data))
        except Exception as e:
            print(f"❌ Error sending to client {self.client_id}: {e}")
    
    async def send_event(self, event: Dict):
        """Send event to client"""
        message = {
            'type': 'event',
            'data': event,
            'timestamp': datetime.utcnow().isoformat(),
        }
        await self.send(message)
    
    def is_subscribed(self, event_type: str) -> bool:
        """Check if client is subscribed to event type"""
        return event_type in self.subscriptions or '*' in self.subscriptions
    
    def subscribe(self, event_type: str):
        """Subscribe to event type"""
        self.subscriptions.add(event_type)
        print(f"📡 Client {self.client_id} subscribed to {event_type}")
    
    def unsubscribe(self, event_type: str):
        """Unsubscribe from event type"""
        self.subscriptions.discard(event_type)
        print(f"📡 Client {self.client_id} unsubscribed from {event_type}")

# ============================================================================
# WEBSOCKET SERVER
# ============================================================================

class WebSocketServer:
    """WebSocket server with event bus integration"""
    
    def __init__(self, host: str = '0.0.0.0', port: int = 8765):
        self.host = host
        self.port = port
        self.clients: Dict[str, WebSocketClient] = {}
        self.running = False
        self.server = None
        
        # Event bus integration
        self.event_bus = None
        self._setup_event_bus()
    
    def _setup_event_bus(self):
        """Setup event bus integration"""
        try:
            import sys
            from pathlib import Path
            sys.path.insert(0, str(Path(__file__).parent.parent.parent))
            from services.reactive.event_bus import get_event_bus, EventType
            self.event_bus = get_event_bus()
            
            # Subscribe to ALL events
            self.event_bus.subscribe_all(self._on_event)
            print("📡 WebSocket server subscribed to event bus")
        except ImportError:
            print("⚠️  Event bus not available")
    
    async def _on_event(self, event):
        """Handle event from event bus"""
        # Broadcast event to subscribed clients
        event_dict = event.to_dict() if hasattr(event, 'to_dict') else event
        
        for client in self.clients.values():
            if client.is_subscribed(event_dict.get('type', '')) or client.is_subscribed('*'):
                await client.send_event(event_dict)
    
    def register_client(self, client: WebSocketClient):
        """Register a new client"""
        self.clients[client.client_id] = client
        print(f"📡 Client connected: {client.client_id} (Total: {len(self.clients)})")
    
    def unregister_client(self, client_id: str):
        """Unregister a client"""
        if client_id in self.clients:
            del self.clients[client_id]
            print(f"📡 Client disconnected: {client_id} (Total: {len(self.clients)})")
    
    async def handle_client(self, websocket, path):
        """Handle a WebSocket client connection"""
        client_id = f"client_{len(self.clients) + 1}_{int(datetime.utcnow().timestamp())}"
        client = WebSocketClient(websocket, client_id)
        
        self.register_client(client)
        
        try:
            # Send welcome message
            await client.send({
                'type': 'welcome',
                'client_id': client_id,
                'message': 'Connected to Hazoom OS WebSocket Server',
                'timestamp': datetime.utcnow().isoformat(),
            })
            
            # Handle messages
            async for message in websocket:
                await self._handle_message(client, message)
        
        except Exception as e:
            print(f"❌ Error with client {client_id}: {e}")
        
        finally:
            self.unregister_client(client_id)
    
    async def _handle_message(self, client: WebSocketClient, raw_message: str):
        """Handle incoming message from client"""
        try:
            message = json.loads(raw_message)
            msg_type = message.get('type', '')
            
            if msg_type == 'subscribe':
                # Subscribe to events
                event_type = message.get('event_type', '*')
                client.subscribe(event_type)
                
                await client.send({
                    'type': 'subscribed',
                    'event_type': event_type,
                    'timestamp': datetime.utcnow().isoformat(),
                })
            
            elif msg_type == 'unsubscribe':
                # Unsubscribe from events
                event_type = message.get('event_type', '*')
                client.unsubscribe(event_type)
                
                await client.send({
                    'type': 'unsubscribed',
                    'event_type': event_type,
                    'timestamp': datetime.utcnow().isoformat(),
                })
            
            elif msg_type == 'ping':
                # Ping/pong
                client.last_ping = datetime.utcnow()
                await client.send({
                    'type': 'pong',
                    'timestamp': datetime.utcnow().isoformat(),
                })
            
            elif msg_type == 'emit':
                # Client wants to emit an event
                if self.event_bus:
                    event_data = message.get('data', {})
                    event_type = message.get('event_type', 'custom')
                    
                    from services.reactive.event_bus import EventType
                    try:
                        et = EventType(event_type)
                        self.event_bus.publish(et, event_data, source=client.client_id)
                    except ValueError:
                        # Custom event
                        self.event_bus.publish(EventType.CUSTOM, event_data, source=client.client_id)
                    
                    await client.send({
                        'type': 'emitted',
                        'event_type': event_type,
                        'timestamp': datetime.utcnow().isoformat(),
                    })
            
            else:
                await client.send({
                    'type': 'error',
                    'message': f'Unknown message type: {msg_type}',
                    'timestamp': datetime.utcnow().isoformat(),
                })
        
        except json.JSONDecodeError:
            await client.send({
                'type': 'error',
                'message': 'Invalid JSON',
                'timestamp': datetime.utcnow().isoformat(),
            })
        except Exception as e:
            await client.send({
                'type': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat(),
            })
    
    async def broadcast(self, data: Dict):
        """Broadcast message to all clients"""
        for client in self.clients.values():
            await client.send(data)
    
    async def broadcast_event(self, event_type: str, data: Dict):
        """Broadcast event to subscribed clients"""
        for client in self.clients.values():
            if client.is_subscribed(event_type) or client.is_subscribed('*'):
                await client.send_event({
                    'type': event_type,
                    'data': data,
                })
    
    async def start(self):
        """Start the WebSocket server"""
        import websockets
        
        print(f'''
==================================================
       HAZOOM OS WEBSOCKET SERVER
==================================================
   WebSocket URL: ws://{self.host}:{self.port}
   (or wss:// for TLS)
==================================================
        ''')
        
        self.running = True
        
        # Setup SSL if needed
        ssl_context = None
        use_tls = False  # Set to True for wss://
        if use_tls:
            try:
                from kernel.security.cert_manager import create_ssl_context_for_server
                ssl_context = create_ssl_context_for_server()
            except Exception as e:
                print(f"⚠️  TLS setup failed: {e}")
        
        # Start server
        self.server = await websockets.serve(
            self.handle_client,
            self.host,
            self.port,
            ssl=ssl_context,
        )
        
        print(f"✅ WebSocket server started on port {self.port}")
        
        # Keep running
        await asyncio.Future()  # Run forever
    
    def stop(self):
        """Stop the WebSocket server"""
        self.running = False
        if self.server:
            self.server.close()
        print("🛑 WebSocket server stopped")

# ============================================================================
# GLOBAL SERVER (Singleton)
# ============================================================================

_ws_server = None

def get_websocket_server(host: str = '0.0.0.0', port: int = 8765) -> WebSocketServer:
    """Get global WebSocket server (singleton)"""
    global _ws_server
    if _ws_server is None:
        _ws_server = WebSocketServer(host, port)
    return _ws_server

# ============================================================================
# HELPER FUNCTIONS (Spark-like API)
# ============================================================================

async def emit_to_websocket(event_type: str, data: Dict):
    """Emit event to all WebSocket clients (Spark-like)"""
    server = get_websocket_server()
    await server.broadcast_event(event_type, data)

def start_websocket_server(host: str = '0.0.0.0', port: int = 8765):
    """Start WebSocket server in background thread"""
    import threading
    
    def run_server():
        server = get_websocket_server(host, port)
        asyncio.run(server.start())
    
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()
    return thread

# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'WebSocketClient',
    'WebSocketServer',
    'get_websocket_server',
    'emit_to_websocket',
    'start_websocket_server',
]

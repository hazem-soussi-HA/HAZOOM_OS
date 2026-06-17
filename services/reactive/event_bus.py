#!/usr/bin/env python3
"""
Hazoom OS - Event Bus (Spark-like Reactive Services)
==============================================
Event-driven architecture for reactive apps.

Features:
    - Pub/Sub pattern (like Apache Spark's event system)
    - Async event processing
    - Multiple event types
    - Web3 event support (blockchain events)
"""

import asyncio
import json
import time
from typing import Dict, List, Callable, Any, Optional
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from collections import defaultdict

# ============================================================================
# EVENT TYPES
# ============================================================================

class EventType(str, Enum):
    """Event types for the system"""
    # System events
    SYSTEM_START = 'system.start'
    SYSTEM_STOP = 'system.stop'
    SYSTEM_ERROR = 'system.error'
    
    # App events
    APP_LAUNCH = 'app.launch'
    APP_CLOSE = 'app.close'
    APP_STAR = 'app.star'
    APP_DOWNLOAD = 'app.download'
    
    # Web3 events
    WEB3_TRANSACTION = 'web3.transaction'
    WEB3_WALLET = 'web3.wallet'
    WEB3_CONTRACT = 'web3.contract'
    WEB3_BLOCK = 'web3.block'
    
    # Neural events
    NEURAL_QUERY = 'neural.query'
    NEURAL_RESPONSE = 'neural.response'
    NEURAL_ERROR = 'neural.error'
    
    # Network events
    NETWORK_CONNECT = 'network.connect'
    NETWORK_DISCONNECT = 'network.disconnect'
    NETWORK_PACKET = 'network.packet'
    
    # Custom events (user-defined)
    CUSTOM = 'custom'

# ============================================================================
# EVENT CLASS
# ============================================================================

@dataclass
class Event:
    """Event object"""
    event_type: EventType
    data: Dict[str, Any]
    source: str = 'system'
    timestamp: float = field(default_factory=time.time)
    event_id: str = field(default_factory=lambda: f"{int(time.time() * 1000)}")
    
    def to_dict(self) -> Dict:
        return {
            'event_id': self.event_id,
            'type': self.event_type,
            'source': self.source,
            'timestamp': self.timestamp,
            'datetime': datetime.fromtimestamp(self.timestamp).isoformat(),
            'data': self.data,
        }
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, d: Dict) -> 'Event':
        return cls(
            event_type=EventType(d['type']),
            data=d['data'],
            source=d.get('source', 'unknown'),
            timestamp=d.get('timestamp', time.time()),
            event_id=d.get('event_id', f"{int(time.time() * 1000)}"),
        )

# ============================================================================
# EVENT HANDLER
# ============================================================================

EventHandler = Callable[[Event], None]

class EventBus:
    """Event bus for publish/subscribe pattern (Spark-like)"""
    
    def __init__(self):
        self._subscribers: Dict[EventType, List[EventHandler]] = defaultdict(list)
        self._all_subscribers: List[EventHandler] = []
        self._history: List[Event] = []
        self._max_history = 1000
        self._running = False
        self._event_queue: asyncio.Queue = None
        
    def subscribe(self, event_type: EventType, handler: EventHandler) -> None:
        """Subscribe to an event type"""
        self._subscribers[event_type].append(handler)
        print(f"📡 Subscribed to {event_type}")
    
    def subscribe_all(self, handler: EventHandler) -> None:
        """Subscribe to ALL events"""
        self._all_subscribers.append(handler)
        print(f"📡 Subscribed to ALL events")
    
    def unsubscribe(self, event_type: EventType, handler: EventHandler) -> None:
        """Unsubscribe from an event type"""
        if handler in self._subscribers[event_type]:
            self._subscribers[event_type].remove(handler)
            print(f"📡 Unsubscribed from {event_type}")
    
    def publish(self, event_type: EventType, data: Dict[str, Any], source: str = 'system') -> Event:
        """Publish an event"""
        event = Event(event_type=event_type, data=data, source=source)
        
        # Add to history
        self._history.append(event)
        if len(self._history) > self._max_history:
            self._history.pop(0)
        
        # Notify specific subscribers
        for handler in self._subscribers.get(event_type, []):
            try:
                handler(event)
            except Exception as e:
                print(f"❌ Error in event handler: {e}")
        
        # Notify "all" subscribers
        for handler in self._all_subscribers:
            try:
                handler(event)
            except Exception as e:
                print(f"❌ Error in 'all' event handler: {e}")
        
        return event
    
    async def publish_async(self, event_type: EventType, data: Dict[str, Any], source: str = 'system') -> Event:
        """Publish an event asynchronously"""
        event = Event(event_type=event_type, data=data, source=source)
        
        # Add to history
        self._history.append(event)
        if len(self._history) > self._max_history:
            self._history.pop(0)
        
        # Notify in async task
        asyncio.create_task(self._notify_subscribers(event))
        
        return event
    
    async def _notify_subscribers(self, event: Event):
        """Notify all subscribers asynchronously"""
        # Specific subscribers
        tasks = []
        for handler in self._subscribers.get(event.event_type, []):
            tasks.append(asyncio.create_task(self._safe_handler(handler, event)))
        
        # All subscribers
        for handler in self._all_subscribers:
            tasks.append(asyncio.create_task(self._safe_handler(handler, event)))
        
        if tasks:
            await asyncio.gather(*tasks)
    
    async def _safe_handler(self, handler: EventHandler, event: Event):
        """Safely call handler"""
        try:
            if asyncio.iscoroutinefunction(handler):
                await handler(event)
            else:
                handler(event)
        except Exception as e:
            print(f"❌ Error in async event handler: {e}")
    
    def get_history(self, event_type: EventType = None, limit: int = 100) -> List[Event]:
        """Get event history"""
        history = self._history
        
        if event_type:
            history = [e for e in history if e.event_type == event_type]
        
        return history[-limit:]
    
    def get_history_dict(self, event_type: EventType = None, limit: int = 100) -> List[Dict]:
        """Get event history as dicts"""
        return [e.to_dict() for e in self.get_history(event_type, limit)]
    
    def clear_history(self):
        """Clear event history"""
        self._history.clear()
        print("🗑️  Event history cleared")
    
    def get_stats(self) -> Dict:
        """Get event bus statistics"""
        stats = {
            'total_events': len(self._history),
            'subscribers': {},
            'event_types': len(self._subscribers),
            'all_subscribers': len(self._all_subscribers),
        }
        
        for event_type, handlers in self._subscribers.items():
            stats['subscribers'][event_type] = len(handlers)
        
        return stats

# ============================================================================
# WEB3 EVENT MONITOR
# ============================================================================

class Web3EventMonitor:
    """Monitor Web3/blockchain events"""
    
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.monitoring = False
        
    def start_monitoring(self, chains: List[str] = None):
        """Start monitoring Web3 events"""
        self.monitoring = True
        print(f"🔐 Started Web3 event monitoring")
        
        # Subscribe to Web3 events
        self.event_bus.subscribe(EventType.WEB3_TRANSACTION, self._handle_transaction)
        self.event_bus.subscribe(EventType.WEB3_BLOCK, self._handle_block)
    
    def stop_monitoring(self):
        """Stop monitoring"""
        self.monitoring = False
        print("🔐 Stopped Web3 event monitoring")
    
    def _handle_transaction(self, event: Event):
        """Handle transaction event"""
        print(f"💎 Transaction: {event.data}")
    
    def _handle_block(self, event: Event):
        """Handle new block event"""
        print(f"🧱 New block: {event.data.get('block_number', 'unknown')}")
    
    def emit_transaction(self, tx_hash: str, from_addr: str, to_addr: str, value: float):
        """Emit a transaction event"""
        if not self.monitoring:
            return
        
        self.event_bus.publish(
            EventType.WEB3_TRANSACTION,
            {
                'tx_hash': tx_hash,
                'from': from_addr,
                'to': to_addr,
                'value': value,
            },
            source='web3_monitor'
        )
    
    def emit_new_block(self, chain: str, block_number: int, tx_count: int):
        """Emit a new block event"""
        if not self.monitoring:
            return
        
        self.event_bus.publish(
            EventType.WEB3_BLOCK,
            {
                'chain': chain,
                'block_number': block_number,
                'tx_count': tx_count,
            },
            source='web3_monitor'
        )

# ============================================================================
# NEURAL EVENT MONITOR
# ============================================================================

class NeuralEventMonitor:
    """Monitor Neural/AI events"""
    
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        
    def start_monitoring(self):
        """Start monitoring neural events"""
        print(f"🧠 Started Neural event monitoring")
        
        # Subscribe to neural events
        self.event_bus.subscribe(EventType.NEURAL_QUERY, self._handle_query)
        self.event_bus.subscribe(EventType.NEURAL_RESPONSE, self._handle_response)
    
    def _handle_query(self, event: Event):
        """Handle neural query event"""
        print(f"🧠 Neural Query: {event.data.get('query', 'N/A')[:50]}...")
    
    def _handle_response(self, event: Event):
        """Handle neural response event"""
        print(f"🧠 Neural Response received")
    
    def emit_query(self, query: str, model: str, user_id: str = 'anonymous'):
        """Emit a neural query event"""
        self.event_bus.publish(
            EventType.NEURAL_QUERY,
            {
                'query': query,
                'model': model,
                'user_id': user_id,
            },
            source='neural_monitor'
        )
    
    def emit_response(self, query: str, response: str, model: str, latency: float):
        """Emit a neural response event"""
        self.event_bus.publish(
            EventType.NEURAL_RESPONSE,
            {
                'query': query,
                'response': response[:100] + '...' if len(response) > 100 else response,
                'model': model,
                'latency': latency,
            },
            source='neural_monitor'
        )

# ============================================================================
# GLOBAL EVENT BUS (Singleton)
# ============================================================================

_event_bus = None
_web3_monitor = None
_neural_monitor = None

def get_event_bus() -> EventBus:
    """Get global event bus (singleton)"""
    global _event_bus
    if _event_bus is None:
        _event_bus = EventBus()
    return _event_bus

def get_web3_monitor() -> Web3EventMonitor:
    """Get global Web3 monitor (singleton)"""
    global _web3_monitor
    if _web3_monitor is None:
        _web3_monitor = Web3EventMonitor(get_event_bus())
    return _web3_monitor

def get_neural_monitor() -> NeuralEventMonitor:
    """Get global Neural monitor (singleton)"""
    global _neural_monitor
    if _neural_monitor is None:
        _neural_monitor = NeuralEventMonitor(get_event_bus())
    return _neural_monitor

# ============================================================================
# HELPER FUNCTIONS (Spark-like API)
# ============================================================================

def emit(event_type: EventType, data: Dict, source: str = 'system') -> Event:
    """Emit an event (Spark-like API)"""
    bus = get_event_bus()
    return bus.publish(event_type, data, source)

def on(event_type: EventType, handler: EventHandler) -> None:
    """Subscribe to an event (Spark-like API)"""
    bus = get_event_bus()
    bus.subscribe(event_type, handler)

def on_all(handler: EventHandler) -> None:
    """Subscribe to all events (Spark-like API)"""
    bus = get_event_bus()
    bus.subscribe_all(handler)

# ============================================================================
# EXPORTS
# ============================================================================

__all__ = [
    'EventType',
    'Event',
    'EventBus',
    'Web3EventMonitor',
    'NeuralEventMonitor',
    'get_event_bus',
    'get_web3_monitor',
    'get_neural_monitor',
    'emit',
    'on',
    'on_all',
]

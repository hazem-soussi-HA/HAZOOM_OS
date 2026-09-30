import asyncio
import os
import json
import logging
import mimetypes
import random
from aiohttp import web

# Import our Aether Core
from aether.aether_protocol import AetherNode, AetherMessage, aether_bus
from automation.automation_framework import AutomationEngine, Task

# Configure Logging
logging.basicConfig(level=logging.INFO, format='[SERVER] %(message)s')
logger = logging.getLogger("HazoomServer")

# Configuration
STATIC_DIR = "G:\\hazoom-os" # The frontend directory
PORT = 8888

# Initialize Aether Node for the Web Server
web_bridge_node = AetherNode("web_bridge_01")
aether_bus.register_node(web_bridge_node)

async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    logger.info("Web Interface connected to Aether.")
    
    # Notify Aether
    await web_bridge_node.send(AetherMessage(
        sender="web_bridge_01",
        recipient="*",
        content={"msg": "User Interface Connected"},
        message_type="system_event"
    ), aether_bus)

    async for msg in ws:
        if msg.type == web.WSMsgType.TEXT:
            data = json.loads(msg.data)
            logger.info(f"Received from UI: {data}")
            
            # Route to Aether
            # Here we would actually process the thought or send to GLM
            response = {"type": "ack", "content": f"Received: {data.get('content')}"}
            await ws.send_json(response)
            
        elif msg.type == web.WSMsgType.ERROR:
            logger.error(f'ws connection closed with exception {ws.exception()}')

    logger.info('Web Interface disconnected')
    return ws

async def heat_handler(request):
    """Simulates quantum component heat levels"""
    data = {
        "components": ["CPU - Neural Core", "Aether Uplink", "Quantum RAM", "GPU - Vision", "Storage - Holographic"],
        "heat_vector": [
            random.randint(20, 60),  # CPU
            random.randint(10, 40),  # Uplink
            random.randint(30, 70),  # RAM
            random.randint(40, 80),  # GPU
            random.randint(15, 35)   # Storage
        ],
        "system_status": "nominal"
    }
    return web.json_response(data)

async def index_handler(request):
    """Serve index.html"""
    return web.FileResponse(os.path.join(STATIC_DIR, "index.html"))

async def init_app():
    app = web.Application()
    
    # Websocket Route
    app.router.add_get('/ws', websocket_handler)
    
    # API Routes
    app.router.add_get('/heat', heat_handler)
    
    # Static Files
    # We serve root index.html specifically, and everything else as static
    app.router.add_get('/', index_handler)
    app.router.add_static('/', STATIC_DIR)
    
    return app

async def start_server():
    # 1. Start Aether
    await web_bridge_node.connect()
    
    # 2. Start Web Server
    app = await init_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, 'localhost', PORT)
    
    print(f"========================================")
    print(f" HAZOOM OS - CORE SERVER ONLINE")
    print(f" Interface: http://localhost:{PORT}")
    print(f" Aether:    Active")
    print(f"========================================")
    
    await site.start()
    
    # Keep alive
    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    try:
        # Check if aiohttp is installed
        import aiohttp
        asyncio.run(start_server())
    except ImportError:
        print("CRITICAL: 'aiohttp' is missing.")
        print("Please run: pip install aiohttp")
    except KeyboardInterrupt:
        pass

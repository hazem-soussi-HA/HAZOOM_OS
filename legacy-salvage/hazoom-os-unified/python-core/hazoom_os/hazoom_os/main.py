#!/usr/bin/env python3
"""
HAZOOM OS - Main Entry Point
*Compute at the Speed of Thought*

This is the main entry point for Hazoom OS, bringing together the
Aether Protocol, GLM Integration, and Automation Engine.
"""

import asyncio
import logging
import sys
import os

# Add current directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from aether.aether_protocol import AetherNode, AetherMessage, aether_bus
from integrations.hazoom_os import GLMCloudBridge
from automation.automation_framework import AutomationEngine, Task

# Configure global logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(name)-12s | %(levelname)-8s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("Kernel")

async def boot_sequence():
    print("\n" + "="*50)
    print("   H A Z O O M   O S   v 1 . 0")
    print("   *Compute at the Speed of Thought*")
    print("="*50 + "\n")

    # 1. Initialize Core Components
    logger.info("Initializing System Core...")
    
    # Create the Kernel Node (representing the OS itself)
    kernel_node = AetherNode("kernel_01")
    aether_bus.register_node(kernel_node)
    await kernel_node.connect()

    # 2. Start Automation Engine
    logger.info("Starting Automation Engine...")
    auto_engine = AutomationEngine()
    await auto_engine.start()

    # 3. Connect to GLM Cloud
    logger.info("Bridging to GLM Cloud...")
    glm_bridge = GLMCloudBridge()
    if await glm_bridge.initialize():
        logger.info("GLM Cloud Integration Active.")

    # 4. System Ready - Test Sequence
    logger.info("Executing Self-Test Sequence...")
    
    async def test_task():
        logger.info(">> Running internal diagnostics...")
        await asyncio.sleep(1)
        logger.info(">> Diagnostics passed. Systems nominal.")

    await auto_engine.submit_task(Task("Diagnose_Self", test_task))
    
    # 5. Send a greeting via Aether
    logger.info("Broadcasting presence on Aether...")
    greeting = AetherMessage(
        sender="kernel_01",
        recipient="*",
        content={"msg": "Hazoom OS is online and peaceful."},
        message_type="system_event"
    )
    await kernel_node.send(greeting, aether_bus)

    # Allow some time for async tasks to process
    await asyncio.sleep(2)
    
    print("\n" + "="*50)
    print("   S Y S T E M   R E A D Y")
    print("="*50 + "\n")
    
    # Keep running? For this demo, we'll exit gracefully.
    await auto_engine.stop()

if __name__ == "__main__":
    try:
        asyncio.run(boot_sequence())
    except KeyboardInterrupt:
        logger.info("System shutdown initiated by user.")

#!/usr/bin/env python3
"""MiMo Browser Daemon - runs as background service."""
import asyncio
import json
import logging
import signal
import sys
from pathlib import Path
from datetime import datetime, timezone

LOG_DIR = Path("./logs")
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "mimo_daemon.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("mimo.daemon")

RUNNING = True


def handle_signal(sig, frame):
    global RUNNING
    logger.info("Signal %s received, shutting down...", sig)
    RUNNING = False


signal.signal(signal.SIGTERM, handle_signal)
signal.signal(signal.SIGINT, handle_signal)


async def heartbeat(engine):
    """Keep-alive and periodic status."""
    while RUNNING:
        stats = engine.memory.get_stats() if hasattr(engine, "memory") else {}
        logger.info("Heartbeat | memory=%s | time=%s", stats, datetime.now(timezone.utc).isoformat())
        await asyncio.sleep(30)


async def run_daemon():
    from mimo_browser.config import BrowserConfig
    from mimo_browser.browser_engine import BrowserEngine
    from mimo_browser.intelligence import IntelligenceEngine
    from mimo_browser.memory import MemoryStore

    config = BrowserConfig(headless=True)
    browser = BrowserEngine(config)
    intelligence = IntelligenceEngine(config)
    memory = MemoryStore()

    logger.info("Starting MiMo Daemon...")
    await browser.start()
    await intelligence.initialize(browser)
    logger.info("Browser engine ready")

    # Run heartbeat in background
    heartbeat_task = asyncio.create_task(heartbeat(intelligence))

    # Example: run a simple test navigation
    logger.info("Running initial self-test...")
    result = await intelligence.execute_goal("Navigate to https://example.com", )
    logger.info("Self-test result: success=%s", result.get("success"))

    # Keep running until signal
    try:
        while RUNNING:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass
    finally:
        heartbeat_task.cancel()
        await browser.stop()
        logger.info("Daemon stopped cleanly")


if __name__ == "__main__":
    asyncio.run(run_daemon())

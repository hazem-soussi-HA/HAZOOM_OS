from __future__ import annotations

import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Any

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from mimo_browser.config import BrowserConfig, BrowserMode
from mimo_browser.intelligence import IntelligenceEngine
from mimo_browser.browser_engine import BrowserEngine
from mimo_browser.memory import MemoryStore
from mimo_browser.handlers import DataExtractor, PageMonitorHandler, WebSearchHandler

console = Console()
logger = logging.getLogger("mimo.cli")


BANNER = r"""
  __  __                  _  ___
 |  \/  | ___  __ _  __| |/ _ \
 | |\/| |/ _ \/ _` |/ _` | | | |
 | |  | |  __/ (_| | (_| | |_| |
 |_|  |_|\___|\__,_|\__,_|\__\_|

  MiMo Intelligent Browser v2.5
  Autonomous Web Navigation Engine
"""


class MiMoCLI:
    """Command-line interface for the MiMo Intelligent Browser."""

    def __init__(self, headless: bool = True, proxy: str | None = None) -> None:
        self.config = BrowserConfig(headless=headless, proxy=proxy)
        self.browser = BrowserEngine(self.config)
        self.intelligence = IntelligenceEngine(self.config)
        self.memory = MemoryStore()
        self.search_handler = WebSearchHandler(self.browser)
        self.extractor = DataExtractor(self.browser)
        self.monitor = PageMonitorHandler(self.browser, self.memory)

    async def initialize(self) -> None:
        await self.browser.start()
        await self.intelligence.initialize(self.browser)
        console.print(Panel(BANNER, style="bold cyan"))

    async def shutdown(self) -> None:
        await self.browser.stop()

    async def cmd_search(self, query: str, engine: str = "google") -> dict[str, Any]:
        urls = {
            "google": "https://www.google.com",
            "bing": "https://www.bing.com",
            "duckduckgo": "https://duckduckgo.com",
        }
        result = await self.search_handler.search(query, urls.get(engine, urls["google"]))
        self.memory.remember({"action": "search", "query": query, "success": result.get("success")})
        return result

    async def cmd_navigate(self, url: str) -> dict[str, Any]:
        result = await self.intelligence.execute_goal(
            f"Navigate to {url} and extract page content",
            BrowserMode.EXPLORE,
        )
        result["url"] = url
        self.memory.remember({"action": "navigate", "url": url})
        return result

    async def cmd_extract(self, url: str, selector: str = "body") -> dict[str, Any]:
        result = await self.intelligence.execute_goal(
            f"Extract data from {url} using selector {selector}",
            BrowserMode.EXTRACT,
        )
        return result

    async def cmd_monitor(self, url: str, interval: int = 60) -> dict[str, Any]:
        result = await self.monitor.snapshot(url)
        self.memory.remember({"action": "monitor", "url": url, "changed": result.get("changed")})
        return result

    async def cmd_interact(self, url: str, actions: list[dict[str, Any]]) -> dict[str, Any]:
        from mimo_browser.config import TaskContext
        context = TaskContext(
            goal=f"Interact with {url}",
            mode=BrowserMode.INTERACT,
            state={"url": url, "actions": actions},
        )
        result = await self.intelligence.execute(context)
        self.memory.remember({"action": "interact", "url": url, "steps": len(actions)})
        return result

    def cmd_memory(self, subcommand: str = "stats", query: str = "") -> Any:
        if subcommand == "stats":
            return self.memory.get_stats()
        elif subcommand == "search":
            results = self.memory.recall(query)
            return [{"key": r.key, "data": r.data, "tags": r.tags} for r in results]
        elif subcommand == "clear":
            self.memory.clear()
            return {"cleared": True}
        return {"error": f"Unknown memory subcommand: {subcommand}"}


async def run_interactive(cli: MiMoCLI) -> None:
    """Run interactive CLI session."""
    console.print("\n[bold green]MiMo Browser Interactive Mode[/bold green]")
    console.print("Commands: search, navigate, extract, monitor, interact, memory, help, quit\n")

    while True:
        try:
            line = console.input("[bold cyan]mimo>[/bold cyan] ").strip()
            if not line:
                continue
            parts = line.split(maxsplit=2)
            cmd = parts[0].lower()
            args = parts[1:] if len(parts) > 1 else []

            if cmd in ("quit", "exit", "q"):
                break
            elif cmd == "help":
                console.print("""
[bold]Available commands:[/bold]
  search <query>              - Search the web
  navigate <url>              - Navigate and extract page
  extract <url> [selector]    - Extract data from page
  monitor <url> [interval]    - Monitor page for changes
  interact <url> <actions>    - Interact with page (JSON)
  memory stats                - Show memory statistics
  memory search <query>       - Search memories
  memory clear                - Clear all memories
  help                        - Show this help
  quit                        - Exit
""")
            elif cmd == "search":
                query = " ".join(args) if args else ""
                if not query:
                    console.print("[red]Usage: search <query>[/red]")
                    continue
                result = await cli.cmd_search(query)
                if result.get("success") and result.get("data"):
                    data = result["data"]
                    console.print(f"\n[bold]Results for: {query}[/bold]")
                    console.print(f"Page type: {data.get('page_type', 'unknown')}")
                    if data.get("top_links"):
                        for link in data["top_links"][:5]:
                            console.print(f"  - {link['text']}: {link['url']}")
                else:
                    console.print(f"[red]Search failed: {result.get('error', 'unknown')}[/red]")

            elif cmd == "navigate":
                url = args[0] if args else ""
                if not url:
                    console.print("[red]Usage: navigate <url>[/red]")
                    continue
                result = await cli.cmd_navigate(url)
                if result.get("success"):
                    console.print(f"[green]Successfully navigated to {url}[/green]")
                else:
                    console.print(f"[red]Navigation failed: {result.get('error', 'unknown')}[/red]")

            elif cmd == "extract":
                url = args[0] if args else ""
                selector = args[1] if len(args) > 1 else "body"
                if not url:
                    console.print("[red]Usage: extract <url> [selector][/red]")
                    continue
                result = await cli.cmd_extract(url, selector)
                console.print(json.dumps(result, indent=2, default=str)[:2000])

            elif cmd == "monitor":
                url = args[0] if args else ""
                interval = int(args[1]) if len(args) > 1 else 60
                if not url:
                    console.print("[red]Usage: monitor <url> [interval][/red]")
                    continue
                result = await cli.cmd_monitor(url, interval)
                status = "[yellow]Changed[/yellow]" if result.get("changed") else "[green]No change[/green]"
                console.print(f"Monitor: {result.get('url')} - {status}")

            elif cmd == "memory":
                subcmd = args[0] if args else "stats"
                query = " ".join(args[1:]) if len(args) > 1 else ""
                result = cli.cmd_memory(subcmd, query)
                console.print(json.dumps(result, indent=2, default=str)[:2000])

            else:
                console.print(f"[red]Unknown command: {cmd}. Type 'help' for usage.[/red]")

        except KeyboardInterrupt:
            break
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")


async def run_task(cli: MiMoCLI, task: str, mode: str = "explore") -> None:
    """Run a single task."""
    browser_mode = BrowserMode(mode)
    result = await cli.intelligence.execute_goal(task, browser_mode)
    console.print(json.dumps(result, indent=2, default=str))


async def main_async(args: list[str] | None = None) -> None:
    """Main async entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="MiMo Intelligent Browser v2.5",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=BANNER,
    )
    parser.add_argument("--no-headless", action="store_true", help="Run browser in visible mode")
    parser.add_argument("--proxy", type=str, help="Proxy server URL")
    parser.add_argument("--task", type=str, help="Execute a single task")
    parser.add_argument("--mode", choices=["explore", "search", "extract", "interact", "monitor"], default="explore")
    parser.add_argument("--config", type=str, help="Path to config file")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose logging")

    parsed = parser.parse_args(args)

    if parsed.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    cli = MiMoCLI(headless=not parsed.no_headless, proxy=parsed.proxy)

    try:
        await cli.initialize()
        if parsed.task:
            await run_task(cli, parsed.task, parsed.mode)
        else:
            await run_interactive(cli)
    finally:
        await cli.shutdown()


def main() -> None:
    asyncio.run(main_async())


if __name__ == "__main__":
    main()

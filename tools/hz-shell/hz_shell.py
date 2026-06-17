#!/usr/bin/env python3
"""
Minimal HZ-Shell prototype (installed at g:\tools\hz-shell).

See README for usage.
"""
import argparse
import shlex
import subprocess
import sys
from typing import Optional

try:
    from rich import print
except Exception:
    def print(*args, **kwargs):
        __builtins__['print'](*args, **kwargs)


def translate(nl: str) -> Optional[str]:
    s = nl.strip().lower()
    if "largest" in s and "file" in s:
        return "du -h --max-depth=1 | sort -hr"
    if "disk usage" in s or "show disk usage" in s:
        return "df -h"
    if s.startswith("list ") and "files" in s:
        return "ls -lah"
    if "processes" in s or "top" in s:
        return "ps aux --sort=-%cpu | head -n 20"
    if "search" in s and "text" in s:
        return "grep -RIn --color=auto '' ."
    return None


def confirm_exec(cmd: str) -> bool:
    print(f"Translated command: {cmd}")
    resp = input("Execute this command? (y/N): ").strip().lower()
    return resp == "y"


def run_command(cmd: str) -> int:
    parts = shlex.split(cmd)
    try:
        proc = subprocess.run(parts)
        return proc.returncode
    except FileNotFoundError:
        print(f"Command not found: {parts[0]}")
        return 127


def main():
    parser = argparse.ArgumentParser(description="HZ-Shell prototype")
    parser.add_argument("query", help="Natural language shell instruction")
    parser.add_argument("--exec", action="store_true", help="Execute translated command")
    args = parser.parse_args()

    cmd = translate(args.query)
    if not cmd:
        print("Sorry, could not translate the instruction.")
        sys.exit(2)

    print(f"NL: {args.query}")
    print(f"CMD: {cmd}")

    if args.exec:
        if confirm_exec(cmd):
            code = run_command(cmd)
            sys.exit(code)
        else:
            print("Execution cancelled.")
            sys.exit(1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Launcher that detaches from terminal properly."""
import os
import sys
import signal

def daemonize():
    if os.fork() > 0:
        sys.exit(0)
    os.setsid()
    if os.fork() > 0:
        sys.exit(0)
    sys.stdout.flush()
    sys.stderr.flush()
    devnull = open(os.devnull, 'r')
    os.dup2(devnull.fileno(), sys.stdin.fileno())

if __name__ == "__main__":
    daemonize()
    os.chdir("/mnt/c/Users/HP/Desktop/deepseek/super_intelligence_do_browsing")
    from server import main
    import asyncio
    asyncio.run(main())

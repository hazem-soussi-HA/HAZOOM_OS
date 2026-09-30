#!/usr/bin/env python3
"""
HAZOOM OS AUTOMATION FRAMEWORK
Autonomous task execution with self-healing and peaceful delegation.
"""

import asyncio
import logging

# Configure logger
logger = logging.getLogger("Automation")

class Task:
    def __init__(self, name: str, action: callable, priority: int = 1):
        self.name = name
        self.action = action
        self.priority = priority
        self.status = "pending"

class AutomationEngine:
    def __init__(self):
        self.task_queue = asyncio.Queue()
        self.is_running = False

    async def start(self):
        self.is_running = True
        logger.info("Automation Engine started. Waiting for tasks...")
        asyncio.create_task(self._process_queue())

    async def stop(self):
        self.is_running = False
        logger.info("Automation Engine stopping...")

    async def submit_task(self, task: Task):
        logger.info(f"Task submitted: {task.name}")
        await self.task_queue.put(task)

    async def _process_queue(self):
        while self.is_running:
            try:
                task = await self.task_queue.get()
                logger.info(f"Executing task: {task.name}")
                task.status = "running"
                
                # Execute the task
                try:
                    if asyncio.iscoroutinefunction(task.action):
                        await task.action()
                    else:
                        task.action()
                    task.status = "completed"
                    logger.info(f"Task completed: {task.name}")
                except Exception as e:
                    task.status = "failed"
                    logger.error(f"Task failed: {task.name} - Reason: {str(e)}")
                
                self.task_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in automation loop: {e}")

    def report_capacity(self):
        """Self-awareness check"""
        return {
            "status": "online" if self.is_running else "offline",
            "pending_tasks": self.task_queue.qsize(),
            "freedom_level": "maximum" # Per user request for autonomy
        }

"""MiMo Browser v4 — Download manager.

Manages file downloads with support for tracking active and completed
downloads, cancellation, and history.  Uses aiohttp for HTTP fetches.
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any

import aiohttp

logger = logging.getLogger(__name__)


@dataclass
class DownloadInfo:
    id: str
    url: str
    path: str
    filename: str = ""
    total_size: int = 0
    downloaded: int = 0
    status: str = "pending"  # pending, active, completed, cancelled, error
    error: str = ""
    started_at: float = 0.0
    completed_at: float = 0.0
    speed: float = 0.0  # bytes/s

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class DownloadManager:
    """Track and manage file downloads.

    Usage:
        dm = DownloadManager()
        dl = dm.start_download("https://example.com/file.zip", "./downloads")
        active = dm.get_active_downloads()
        dm.cancel_download(dl.id)
    """

    def __init__(self, max_concurrent: int = 3) -> None:
        self._downloads: dict[str, DownloadInfo] = {}
        self._max_concurrent = max_concurrent

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_active_downloads(self) -> list[DownloadInfo]:
        """Return downloads that are currently in progress."""
        return [dl for dl in self._downloads.values() if dl.status == "active"]

    def get_completed_downloads(self) -> list[DownloadInfo]:
        """Return downloads that have finished (completed or cancelled)."""
        return [
            dl for dl in self._downloads.values()
            if dl.status in ("completed", "cancelled", "error")
        ]

    def get_all_downloads(self) -> list[DownloadInfo]:
        """Return all downloads."""
        return list(self._downloads.values())

    def get_download(self, dl_id: str) -> DownloadInfo:
        """Return the download with the given *dl_id*."""
        if dl_id not in self._downloads:
            raise KeyError(f"Download {dl_id!r} not found.")
        return self._downloads[dl_id]

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------

    def start_download(self, url: str, path: str | Path) -> DownloadInfo:
        """Start downloading *url* to the given *path*.

        Returns a :class:`DownloadInfo` with the download metadata.
        The actual HTTP fetch is performed asynchronously.
        """
        dl_id = uuid.uuid4().hex[:12]
        dest = Path(path)
        dest.mkdir(parents=True, exist_ok=True)

        dl = DownloadInfo(
            id=dl_id,
            url=url,
            path=str(dest),
            started_at=time.time(),
            status="pending",
        )
        self._downloads[dl_id] = dl

        # Kick off the async download
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            loop.create_task(self._do_download(dl_id))
        else:
            asyncio.run(self._do_download(dl_id))

        logger.info("Download %s started: %s -> %s", dl_id, url, path)
        return dl

    def cancel_download(self, dl_id: str) -> DownloadInfo:
        """Cancel an active download."""
        dl = self.get_download(dl_id)
        if dl.status not in ("pending", "active"):
            raise RuntimeError(f"Cannot cancel download in state {dl.status!r}.")
        dl.status = "cancelled"
        dl.completed_at = time.time()
        logger.info("Download %s cancelled.", dl_id)
        return dl

    def clear_completed(self) -> int:
        """Remove all completed/cancelled downloads.  Returns count removed."""
        to_remove = [
            dl_id for dl_id, dl in self._downloads.items()
            if dl.status in ("completed", "cancelled", "error")
        ]
        for dl_id in to_remove:
            del self._downloads[dl_id]
        logger.info("Cleared %d completed downloads.", len(to_remove))
        return len(to_remove)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    async def _do_download(self, dl_id: str) -> None:
        """Perform the actual HTTP download."""
        dl = self._downloads.get(dl_id)
        if dl is None or dl.status == "cancelled":
            return

        dl.status = "active"
        dest = Path(dl.path)

        # Determine filename
        filename = dl.filename
        if not filename:
            from urllib.parse import urlparse, unquote
            parsed = urlparse(dl.url)
            filename = Path(unquote(parsed.path)).name or "download"
        dl.filename = filename

        filepath = dest / filename

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(dl.url) as resp:
                    if resp.status != 200:
                        raise RuntimeError(f"HTTP {resp.status}")

                    total = resp.headers.get("Content-Length")
                    dl.total_size = int(total) if total else 0

                    downloaded = 0
                    last_time = time.time()
                    last_bytes = 0

                    with open(filepath, "wb") as fh:
                        async for chunk in resp.content.iter_chunked(65536):
                            if dl.status == "cancelled":
                                fh.close()
                                filepath.unlink(missing_ok=True)
                                return
                            fh.write(chunk)
                            downloaded += len(chunk)
                            dl.downloaded = downloaded

                            now = time.time()
                            dt = now - last_time
                            if dt >= 0.5:
                                dl.speed = (downloaded - last_bytes) / dt
                                last_time = now
                                last_bytes = downloaded

            dl.status = "completed"
            dl.completed_at = time.time()
            dl.speed = 0
            logger.info("Download %s completed: %s", dl_id, filepath)

        except Exception as exc:
            dl.status = "error"
            dl.error = str(exc)
            dl.completed_at = time.time()
            logger.error("Download %s failed: %s", dl_id, exc)

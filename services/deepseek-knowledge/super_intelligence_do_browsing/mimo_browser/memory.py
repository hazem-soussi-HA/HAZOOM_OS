from __future__ import annotations

import json
import hashlib
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger("mimo.memory")


@dataclass
class MemoryEntry:
    key: str
    data: Any
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    access_count: int = 0
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


class MemoryStore:
    """Persistent memory system for learning and context retention."""

    def __init__(self, path: str | Path = "./data/memory") -> None:
        self._path = Path(path)
        self._path.mkdir(parents=True, exist_ok=True)
        self._episodic: dict[str, MemoryEntry] = {}
        self._semantic: dict[str, Any] = {}
        self._procedural: dict[str, list[str]] = {}
        self._load()

    def _load(self) -> None:
        ep_file = self._path / "episodic.json"
        sem_file = self._path / "semantic.json"
        proc_file = self._path / "procedural.json"
        if ep_file.exists():
            raw = json.loads(ep_file.read_text())
            self._episodic = {k: MemoryEntry(**v) for k, v in raw.items()}
        if sem_file.exists():
            self._semantic = json.loads(sem_file.read_text())
        if proc_file.exists():
            self._procedural = json.loads(proc_file.read_text())

    def _save(self) -> None:
        (self._path / "episodic.json").write_text(
            json.dumps({k: v.__dict__ for k, v in self._episodic.items()}, indent=2)
        )
        (self._path / "semantic.json").write_text(json.dumps(self._semantic, indent=2))
        (self._path / "procedural.json").write_text(json.dumps(self._procedural, indent=2))

    def _key(self, content: str) -> str:
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def remember(self, content: Any, tags: list[str] | None = None, category: str = "episodic") -> str:
        serialized = json.dumps(content, default=str)
        key = self._key(serialized)
        entry = MemoryEntry(key=key, data=content, tags=tags or [])
        self._episodic[key] = entry
        if category == "semantic":
            self._semantic[key] = content
        self._save()
        logger.info("Stored memory: %s (category=%s)", key, category)
        return key

    def recall(self, query: str, limit: int = 10) -> list[MemoryEntry]:
        results = []
        query_lower = query.lower()
        for entry in self._episodic.values():
            score = 0
            data_str = json.dumps(entry.data, default=str).lower()
            if query_lower in data_str:
                score += 10
            if any(query_lower in tag.lower() for tag in entry.tags):
                score += 5
            if score > 0:
                entry.access_count += 1
                results.append((score, entry))
        results.sort(key=lambda x: x[0], reverse=True)
        return [entry for _, entry in results[:limit]]

    def learn_procedure(self, name: str, steps: list[str]) -> None:
        self._procedural[name] = steps
        self._save()
        logger.info("Learned procedure: %s (%d steps)", name, len(steps))

    def get_procedure(self, name: str) -> list[str] | None:
        return self._procedural.get(name)

    def get_stats(self) -> dict[str, Any]:
        return {
            "episodic_memories": len(self._episodic),
            "semantic_memories": len(self._semantic),
            "procedures": len(self._procedural),
        }

    def clear(self) -> None:
        self._episodic.clear()
        self._semantic.clear()
        self._procedural.clear()
        self._save()

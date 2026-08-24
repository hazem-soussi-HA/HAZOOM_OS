"""MiMo Browser v4 — BASIC IDE Module
Encrypted storage and management for BASIC programs.
"""
from __future__ import annotations

import json
import time
import hashlib
from pathlib import Path
from typing import Any

from mimo_browser_v4.security.crypto import encrypt_b64, decrypt_b64


class BasicProgram:
    """Represents a stored BASIC program with metadata."""

    def __init__(self, name: str, source: str, author: str = "",
                 description: str = "", tags: list[str] | None = None,
                 created: str = "", modified: str = ""):
        self.name = name
        self.source = source
        self.author = author
        self.description = description
        self.tags = tags or []
        self.created = created or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self.modified = modified or self.created

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "source": self.source,
            "author": self.author,
            "description": self.description,
            "tags": self.tags,
            "created": self.created,
            "modified": self.modified,
        }

    @classmethod
    def from_dict(cls, data: dict) -> BasicProgram:
        return cls(
            name=data.get("name", ""),
            source=data.get("source", ""),
            author=data.get("author", ""),
            description=data.get("description", ""),
            tags=data.get("tags", []),
            created=data.get("created", ""),
            modified=data.get("modified", ""),
        )


class BasicEncryptedStorage:
    """Encrypted storage for BASIC programs using AES-256-GCM."""

    def __init__(self, path: str = "./data/basic_programs", password: str = "mimo-basic-key") -> None:
        self._path = Path(path)
        self._path.mkdir(parents=True, exist_ok=True)
        self._password = password
        self._index_file = self._path / "index.enc"
        self._index: dict[str, str] = {}  # name -> filename
        self._load_index()

    def _load_index(self) -> None:
        if self._index_file.exists():
            try:
                encrypted = self._index_file.read_text()
                decrypted = decrypt_b64(encrypted, self._password)
                self._index = json.loads(decrypted)
            except Exception:
                self._index = {}

    def _save_index(self) -> None:
        encrypted = encrypt_b64(json.dumps(self._index), self._password)
        self._index_file.write_text(encrypted)

    def _program_filename(self, name: str) -> str:
        name_hash = hashlib.sha256(name.encode()).hexdigest()[:16]
        return f"prog_{name_hash}.enc"

    def save(self, program: BasicProgram) -> bool:
        """Encrypt and save a BASIC program."""
        try:
            program.modified = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            data = json.dumps(program.to_dict())
            encrypted = encrypt_b64(data, self._password)
            filename = self._program_filename(program.name)
            (self._path / filename).write_text(encrypted)
            self._index[program.name] = filename
            self._save_index()
            return True
        except Exception as e:
            print(f"BASIC save error: {e}")
            return False

    def load(self, name: str) -> BasicProgram | None:
        """Load and decrypt a BASIC program."""
        try:
            filename = self._index.get(name)
            if not filename:
                return None
            filepath = self._path / filename
            if not filepath.exists():
                return None
            encrypted = filepath.read_text()
            decrypted = decrypt_b64(encrypted, self._password)
            data = json.loads(decrypted)
            return BasicProgram.from_dict(data)
        except Exception as e:
            print(f"BASIC load error: {e}")
            return None

    def delete(self, name: str) -> bool:
        """Delete a stored program."""
        try:
            filename = self._index.pop(name, None)
            if filename:
                filepath = self._path / filename
                if filepath.exists():
                    filepath.unlink()
                self._save_index()
            return True
        except Exception:
            return False

    def list_programs(self) -> list[dict[str, Any]]:
        """List all stored programs (metadata only, no source)."""
        results = []
        for name, filename in self._index.items():
            try:
                filepath = self._path / filename
                if filepath.exists():
                    encrypted = filepath.read_text()
                    decrypted = decrypt_b64(encrypted, self._password)
                    data = json.loads(decrypted)
                    results.append({
                        "name": data.get("name", name),
                        "author": data.get("author", ""),
                        "description": data.get("description", ""),
                        "tags": data.get("tags", []),
                        "created": data.get("created", ""),
                        "modified": data.get("modified", ""),
                        "lines": len(data.get("source", "").splitlines()),
                    })
            except Exception:
                results.append({"name": name, "error": True})
        return results

    def export_program(self, name: str) -> str | None:
        """Export program as plaintext BASIC source."""
        program = self.load(name)
        return program.source if program else None

    def import_program(self, name: str, source: str, **kwargs) -> bool:
        """Import a BASIC program from source text."""
        program = BasicProgram(name=name, source=source, **kwargs)
        return self.save(program)


class BasicDemoPrograms:
    """Built-in demo programs that ship with MiMo Browser."""

    @staticmethod
    def get_demo(name: str) -> str | None:
        demos = {
            "hello": """10 REM HELLO WORLD
20 PRINT "HELLO FROM MiMo BASIC!"
30 FOR I = 1 TO 5
40 PRINT "LINE "; I
50 NEXT I
60 END""",

            "graphics": """10 REM GRAPHICS DEMO
20 CLS
30 COLOR 15
40 FOR X = 0 TO 159
50 PLOT X, 40 + SIN(X / 10) * 20
60 NEXT X
70 COLOR 12
80 RECT 20, 60, 80, 40
90 COLOR 14
100 CIRCLE 100, 80, 20
110 PRINT "MiMo BASIC GRAPHICS"
120 WAIT 120
130 END""",

            "stars": """10 REM STARFIELD
20 CLS
30 FOR I = 1 TO 50
40 X = RND(160)
50 Y = RND(100)
60 C = RND(16)
70 COLOR C
80 PLOT X, Y
90 NEXT I
100 PRINT "STARFIELD"
110 WAIT 180
120 END""",

            "maze": """10 REM SIMPLE MAZE
20 CLS
30 COLOR 15
40 FOR Y = 0 TO 12
50 FOR X = 0 TO 19
60 IF RND(3) = 1 THEN RECT X * 8, Y * 8, 8, 8
70 NEXT X
80 NEXT Y
90 COLOR 12
100 RECT 0, 0, 8, 8
110 COLOR 10
120 RECT 152, 88, 8, 8
130 PRINT "FIND THE EXIT!"
140 END""",

            "encrypt": """10 REM ENCRYPTED MESSAGE DEMO
20 PRINT "MiMo BASIC ENCRYPTION"
30 PRINT "====================="
40 DIM MSG$(26)
50 FOR I = 1 TO 26
60 READ MSG$(I)
70 NEXT I
80 DATA A,B,C,D,E,F,G,H,I,J,K,L,M
90 DATA N,O,P,Q,R,S,T,U,V,W,X,Y,Z
100 PRINT
110 PRINT "ORIGINAL: HELLO"
120 PRINT "ENCRYPTED WITH CAESAR +3:"
130 FOR I = 1 TO 5
140 C = ASC(MID$("HELLO",I,1)) - 65
150 E = (C + 3) MOD 26
160 PRINT MSG$(E + 1);
170 NEXT I
180 PRINT
190 END""",

            "bounce": """10 REM BOUNCING BALL
20 CLS
30 X = 80
40 Y = 50
50 DX = 2
60 DY = 2
70 COLOR 15
80 RECT 0, 0, 160, 100
90 GOTO 110
100 REM MAIN LOOP
110 COLOR 0
120 CIRCLE X, Y, 5
130 X = X + DX
140 Y = Y + DY
150 IF X <= 5 OR X >= 155 THEN DX = -DX
160 IF Y <= 5 OR Y >= 95 THEN DY = -DY
170 COLOR 12
180 CIRCLE X, Y, 5
190 WAIT 2
200 GOTO 100""",
        }
        return demos.get(name.lower())

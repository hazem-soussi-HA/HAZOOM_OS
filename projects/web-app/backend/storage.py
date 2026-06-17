import json
import os
from abc import ABC, abstractmethod

class Storage(ABC):
    @abstractmethod
    def save(self, key, data):
        pass

    @abstractmethod
    def load(self, key):
        pass

class FileStorage(Storage):
    def __init__(self, path):
        self.path = path
        os.makedirs(path, exist_ok=True)

    def save(self, key, data):
        with open(os.path.join(self.path, key), 'w') as f:
            json.dump(data, f)

    def load(self, key):
        try:
            with open(os.path.join(self.path, key), 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return None

# Placeholder for other backends
class DatabaseStorage(Storage):
    def __init__(self, db_path):
        # Assume sqlite for simplicity
        import sqlite3
        self.conn = sqlite3.connect(db_path)

    def save(self, key, data):
        # Simple implementation
        self.conn.execute("INSERT OR REPLACE INTO storage (key, value) VALUES (?, ?)", (key, json.dumps(data)))
        self.conn.commit()

    def load(self, key):
        cursor = self.conn.execute("SELECT value FROM storage WHERE key=?", (key,))
        row = cursor.fetchone()
        return json.loads(row[0]) if row else None

class CloudStorage(Storage):
    def __init__(self, bucket):
        # Placeholder, would need actual cloud SDK
        self.bucket = bucket

    def save(self, key, data):
        # Placeholder
        pass

    def load(self, key):
        # Placeholder
        pass
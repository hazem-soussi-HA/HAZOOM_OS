"""
Redis-based caching and session management for better performance and persistence.
"""
import json
import redis
from typing import Any, Optional, Dict
import os
from app.core.config import settings


class CacheManager:
    """Redis-based cache manager with fallback to in-memory storage."""

    def __init__(self):
        self.redis_client = None
        self.memory_cache: Dict[str, Any] = {}

        # Try to connect to Redis
        if settings.REDIS_URL:
            try:
                self.redis_client = redis.from_url(settings.REDIS_URL)
                self.redis_client.ping()  # Test connection
                print("Redis connection established")
            except Exception as e:
                print(f"Redis connection failed: {e}")
                self.redis_client = None
        else:
            print("Redis not configured, using in-memory cache")

    def _get_key(self, namespace: str, key: str) -> str:
        """Generate a namespaced key."""
        return f"{namespace}:{key}"

    def set(self, namespace: str, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set a value in cache."""
        try:
            serialized_value = json.dumps(value)
            cache_key = self._get_key(namespace, key)

            if self.redis_client:
                if ttl:
                    return bool(self.redis_client.setex(cache_key, ttl, serialized_value))
                else:
                    return bool(self.redis_client.set(cache_key, serialized_value))
            else:
                self.memory_cache[cache_key] = value
                return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False

    def get(self, namespace: str, key: str) -> Optional[Any]:
        """Get a value from cache."""
        try:
            cache_key = self._get_key(namespace, key)

            if self.redis_client:
                value = self.redis_client.get(cache_key)
                if value:
                    return json.loads(value)
            else:
                return self.memory_cache.get(cache_key)
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    def delete(self, namespace: str, key: str) -> bool:
        """Delete a value from cache."""
        try:
            cache_key = self._get_key(namespace, key)

            if self.redis_client:
                return bool(self.redis_client.delete(cache_key))
            else:
                if cache_key in self.memory_cache:
                    del self.memory_cache[cache_key]
                    return True
                return False
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False

    def exists(self, namespace: str, key: str) -> bool:
        """Check if a key exists in cache."""
        try:
            cache_key = self._get_key(namespace, key)

            if self.redis_client:
                return bool(self.redis_client.exists(cache_key))
            else:
                return cache_key in self.memory_cache
        except Exception as e:
            print(f"Cache exists error: {e}")
            return False

    def clear_namespace(self, namespace: str) -> bool:
        """Clear all keys in a namespace."""
        try:
            if self.redis_client:
                # Use SCAN to find all keys with the namespace prefix
                keys = []
                for key in self.redis_client.scan_iter(f"{namespace}:*"):
                    keys.append(key)
                if keys:
                    return bool(self.redis_client.delete(*keys))
                return True
            else:
                # Clear memory cache for this namespace
                keys_to_delete = [k for k in self.memory_cache.keys() if k.startswith(f"{namespace}:")]
                for key in keys_to_delete:
                    del self.memory_cache[key]
                return True
        except Exception as e:
            print(f"Cache clear namespace error: {e}")
            return False


# Global cache instance
cache_manager = CacheManager()


class TokenManager:
    """Token management with caching."""

    def __init__(self):
        self.cache = cache_manager

    def store_token(self, token: str, data: dict, ttl_seconds: int = 2592000) -> bool:  # 30 days default
        """Store token data with TTL."""
        return self.cache.set("tokens", token, data, ttl_seconds)

    def get_token(self, token: str) -> Optional[dict]:
        """Retrieve token data."""
        return self.cache.get("tokens", token)

    def delete_token(self, token: str) -> bool:
        """Delete token."""
        return self.cache.delete("tokens", token)

    def token_exists(self, token: str) -> bool:
        """Check if token exists."""
        return self.cache.exists("tokens", token)


class SessionManager:
    """Session management with caching."""

    def __init__(self):
        self.cache = cache_manager

    def create_session(self, session_id: str, data: dict, ttl_seconds: int = 3600) -> bool:  # 1 hour default
        """Create a session with TTL."""
        return self.cache.set("sessions", session_id, data, ttl_seconds)

    def get_session(self, session_id: str) -> Optional[dict]:
        """Get session data."""
        return self.cache.get("sessions", session_id)

    def update_session(self, session_id: str, data: dict, ttl_seconds: int = 3600) -> bool:
        """Update session data."""
        return self.cache.set("sessions", session_id, data, ttl_seconds)

    def delete_session(self, session_id: str) -> bool:
        """Delete session."""
        return self.cache.delete("sessions", session_id)

    def session_exists(self, session_id: str) -> bool:
        """Check if session exists."""
        return self.cache.exists("sessions", session_id)

    def clear_all_sessions(self) -> bool:
        """Clear all sessions."""
        return self.cache.clear_namespace("sessions")


# Global instances
token_manager = TokenManager()
session_manager = SessionManager()
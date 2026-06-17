"""
Rate limiting middleware for API protection.
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
from collections import defaultdict
from app.core.cache import cache_manager


class RateLimiter:
    """Rate limiter using sliding window algorithm."""

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.cache = cache_manager

    def _get_window_key(self, identifier: str, current_minute: int) -> str:
        """Generate window key for the current minute."""
        return f"rate_limit:{identifier}:{current_minute}"

    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed for the given identifier."""
        current_minute = int(time.time() // 60)

        # Clean up old windows (older than 5 minutes)
        for minute in range(current_minute - 5, current_minute):
            old_key = self._get_window_key(identifier, minute)
            self.cache.delete("rate_limit", old_key)

        # Check current window
        window_key = self._get_window_key(identifier, current_minute)
        request_count = self.cache.get("rate_limit", window_key) or 0

        if request_count >= self.requests_per_minute:
            return False

        # Increment counter
        self.cache.set("rate_limit", window_key, request_count + 1, ttl=300)  # 5 minutes TTL
        return True


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting API requests."""

    def __init__(self, app, exclude_paths: list = None, rate_limiter: RateLimiter = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or ["/health", "/docs", "/openapi.json"]
        self.rate_limiter = rate_limiter or RateLimiter()

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)

        # Get client identifier (IP address)
        client_ip = request.client.host if request.client else "unknown"

        # Check rate limit
        if not self.rate_limiter.is_allowed(client_ip):
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later."
            )

        # Proceed with request
        response = await call_next(request)
        return response


# Global rate limiter instance
rate_limiter = RateLimiter(requests_per_minute=60)  # 60 requests per minute per IP
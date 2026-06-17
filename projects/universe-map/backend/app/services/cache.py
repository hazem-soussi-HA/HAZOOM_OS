import redis.asyncio as redis
import json
from typing import Optional, Any
from app.core.config import settings

class CacheService:
    def __init__(self):
        self.redis: Optional[redis.Redis] = None
    
    async def connect(self):
        self.redis = await redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    
    async def disconnect(self):
        if self.redis:
            await self.redis.close()
    
    async def get(self, key: str) -> Optional[Any]:
        if not self.redis:
            await self.connect()
        
        value = await self.redis.get(key)
        return json.loads(value) if value else None
    
    async def set(self, key: str, value: Any, ttl: int = None) -> bool:
        if not self.redis:
            await self.connect()
        
        serialized = json.dumps(value)
        if ttl:
            return await self.redis.setex(key, ttl, serialized)
        return await self.redis.set(key, serialized)
    
    async def delete(self, key: str) -> bool:
        if not self.redis:
            await self.connect()
        return bool(await self.redis.delete(key))
    
    async def clear_pattern(self, pattern: str) -> int:
        if not self.redis:
            await self.connect()
        
        keys = await self.redis.keys(pattern)
        if keys:
            return await self.redis.delete(*keys)
        return 0


cache_service = CacheService()

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "Universe Map"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_SECRET: str = "your-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24 * 7
    
    DATABASE_URL: str = "postgresql://universe:universe_pass@localhost:5432/universe_map"
    
    REDIS_URL: str = "redis://localhost:6379/0"
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://universe-map.example.com"
    ]
    
    NASA_API_KEY: str = ""
    SIMBAD_API_KEY: str = ""
    GAIA_API_KEY: str = ""
    
    CACHE_TTL: int = 300
    RATE_LIMIT_PER_MINUTE: int = 100
    
    PROMETHEUS_PORT: int = 9090
    GRAFANA_PASSWORD: str = "admin"
    
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    ATTENTION_MODEL_PATH: str = "./models/attention_optimizer.pt"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

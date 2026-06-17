from pydantic_settings import BaseSettings
from typing import Optional, List
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hazoom Unified Premium"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str  # Required, loaded from SECRET_KEY environment variable
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:8080", "http://localhost:3000", "http://127.0.0.1:8080", "http://localhost:3002"]
    DATABASE_URL: str  # Required, loaded from DATABASE_URL environment variable

    # AI Provider Configuration
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    DEFAULT_AI_PROVIDER: str = "ollama"
    DEFAULT_MODEL: str = "llama2"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Feature Flags
    ENABLE_AI_CHAT: bool = True
    ENABLE_QUIZ_GENERATION: bool = True
    ENABLE_PDF_PROCESSING: bool = True
    ENABLE_PROGRESS_TRACKING: bool = True
    ENABLE_ANALYTICS: bool = True

    # RAG System (Optional)
    RAG_ENABLED: bool = False
    RAG_MODEL_NAME: str = "all-MiniLM-L6-v2"
    RAG_TOP_K: int = 5
    RAG_SCORE_THRESHOLD: float = 0.5
    RAG_DATA_PATH: str = "./data"
    RAG_COLLECTION_NAME: str = "hazoom_rag"

    # Development Settings
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# Create a lazy settings instance for backward compatibility
def _get_lazy_settings():
    return get_settings()

# Export settings instance (lazy)
import sys
_module = sys.modules[__name__]
setattr(_module, 'settings', _get_lazy_settings())

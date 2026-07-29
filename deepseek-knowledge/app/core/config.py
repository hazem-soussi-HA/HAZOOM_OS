from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
import os


class Settings(BaseSettings):
    APP_NAME: str = "The History of the Internet"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, validation_alias="DEBUG")
    
    SECRET_KEY: str = Field(validation_alias="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    DATABASE_URL: str = Field(validation_alias="DATABASE_URL")
    REDIS_URL: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    
    ENCRYPTION_KEY: str = Field(validation_alias="ENCRYPTION_KEY")
    
    VIDEO_STORAGE_PATH: str = Field(default="/app/storage/videos", validation_alias="VIDEO_STORAGE_PATH")
    TEMP_STORAGE_PATH: str = Field(default="/app/storage/temp", validation_alias="TEMP_STORAGE_PATH")
    ASSETS_PATH: str = Field(default="/app/assets", validation_alias="ASSETS_PATH")
    
    FFMPEG_PATH: str = Field(default="ffmpeg", validation_alias="FFMPEG_PATH")
    
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/1", validation_alias="CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/2", validation_alias="CELERY_RESULT_BACKEND")
    
    MAX_VIDEO_DURATION_SECONDS: int = 300
    ALLOWED_ORIGINS: list[str] = Field(default=["*"], validation_alias="ALLOWED_ORIGINS")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
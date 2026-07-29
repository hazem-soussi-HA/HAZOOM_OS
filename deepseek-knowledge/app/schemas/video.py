from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class VideoStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class VideoCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    script: str = Field(..., min_length=100)
    duration_seconds: Optional[int] = Field(default=0, ge=0, le=300)


class VideoResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    script: str
    status: VideoStatus
    duration_seconds: int
    output_path: Optional[str]
    error_message: Optional[str]
    owner_id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class VideoJobCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    script: str = Field(..., min_length=100)


class VideoJobResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    script: str
    status: VideoStatus
    duration_seconds: int
    output_path: Optional[str]
    error_message: Optional[str]
    owner_id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class VideoGenerationRequest(BaseModel):
    title: str
    description: Optional[str] = None
    script: str
    template: Optional[str] = "documentary"
    style: Optional[str] = "professional"


class VideoGenerationResponse(BaseModel):
    job_id: str
    status: str
    estimated_time: Optional[int] = None
    download_url: Optional[str] = None
    size_kb: Optional[int] = None
    duration_seconds: Optional[int] = None
    segments: Optional[int] = None
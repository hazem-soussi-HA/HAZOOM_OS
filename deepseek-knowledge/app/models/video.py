import enum
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Enum, ForeignKey, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class VideoStatus(str, enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class VideoJob(Base):
    __tablename__ = "video_jobs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    script: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[VideoStatus] = mapped_column(Enum(VideoStatus), default=VideoStatus.PENDING, nullable=False, index=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    output_path: Mapped[str] = mapped_column(String(1000), nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    celery_task_id: Mapped[str] = mapped_column(String(255), nullable=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    owner: Mapped["User"] = relationship(back_populates="videos")

    __table_args__ = (
        Index("ix_video_jobs_owner_status", "owner_id", "status"),
        Index("ix_video_jobs_created", "created_at"),
    )
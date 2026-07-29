from celery import Celery
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.video import VideoJob, VideoStatus
from app.services.video_generator import VideoGeneratorService
from app.core.security import encrypt_data
from app.knowledge.internet_history import get_script
import logging

logger = logging.getLogger(__name__)

# Celery app configuration
celery_app = Celery(
    "video_generation",
    broker="redis://localhost:6379/1",
    backend="redis://localhost:6379/2",
)

video_generator = VideoGeneratorService()


@celery_app.task(bind=True, max_retries=3)
async def generate_video_task(self, job_id: str, title: str, script: str, description: str, owner_id: int):
    """Celery task for video generation."""
    db_session = AsyncSessionLocal()

    try:
        # Update job status to processing
        await db_session.execute(
            VideoJob.__table__.update()
            .where(VideoJob.celery_task_id == job_id)
            .values(status=VideoStatus.PROCESSING)
        )
        await db_session.commit()

        # Generate video
        video_path, duration = await video_generator.generate_video_from_script(
            script=script,
            title=title,
            description=description,
        )

        # Encrypt video path for storage
        encrypted_path = encrypt_data(video_path)

        # Update job status to completed
        await db_session.execute(
            VideoJob.__table__.update()
            .where(VideoJob.celery_task_id == job_id)
            .values(
                status=VideoStatus.COMPLETED,
                output_path=encrypted_path,
                duration_seconds=duration,
                completed_at=datetime.now(timezone.utc),
            )
        )
        await db_session.commit()

        logger.info(f"Video generation completed successfully for job {job_id}")
        return {"job_id": job_id, "status": "completed", "video_path": video_path}

    except Exception as e:
        logger.error(f"Video generation failed for job {job_id}: {str(e)}")

        # Update job status to failed
        await db_session.execute(
            VideoJob.__table__.update()
            .where(VideoJob.celery_task_id == job_id)
            .values(
                status=VideoStatus.FAILED,
                error_message=str(e),
            )
        )
        await db_session.commit()

        # Retry logic
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))

    finally:
        await db_session.close()
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.video import VideoJob, VideoStatus
from app.schemas.video import VideoGenerationRequest, VideoGenerationResponse, VideoJobResponse
from app.services.video_generator import VideoGeneratorService
import os

router = APIRouter(prefix="/videos", tags=["Videos"])
video_generator = VideoGeneratorService()


@router.post("/generate", response_model=VideoGenerationResponse)
async def generate_video(
    request: VideoGenerationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await video_generator.generate_video(request.script, request.title)

        db_video = VideoJob(
            title=request.title,
            description=request.description,
            script=request.script,
            status=VideoStatus.COMPLETED,
            owner_id=current_user.id,
            output_path=result["path"],
            celery_task_id=result["job_id"],
            duration_seconds=int(result.get("duration", 8)),
        )
        db.add(db_video)
        await db.commit()
        await db.refresh(db_video)

        return {
            "job_id": result["job_id"],
            "status": "completed",
            "estimated_time": 0,
            "download_url": result["url"],
            "size_kb": result.get("size", 0) // 1024,
            "duration_seconds": int(result.get("duration", 0)),
            "segments": result.get("segments", 0),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video generation failed: {str(e)}",
        )


@router.get("/download/{job_id}")
async def download_video(job_id: str):
    storage = os.environ.get("VIDEO_STORAGE_PATH", "storage/videos")
    path = os.path.join(storage, f"{job_id}.mp4")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(path, media_type="video/mp4", filename=f"nano-{job_id}.mp4")


@router.get("/jobs", response_model=list[VideoJobResponse])
async def list_video_jobs(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role.value == "admin":
        stmt = select(VideoJob).order_by(VideoJob.created_at.desc())
    else:
        stmt = select(VideoJob).where(VideoJob.owner_id == current_user.id).order_by(VideoJob.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/jobs/{job_id}", response_model=VideoJobResponse)
async def get_video_job(
    job_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(VideoJob).where(VideoJob.celery_task_id == job_id)
    if current_user.role.value != "admin":
        stmt = stmt.where(VideoJob.owner_id == current_user.id)
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Video job not found")
    return job


@router.get("/{video_id}", response_model=VideoJobResponse)
async def get_video(
    video_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(VideoJob).where(VideoJob.id == video_id)
    if current_user.role.value != "admin":
        stmt = stmt.where(VideoJob.owner_id == current_user.id)
    result = await db.execute(stmt)
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

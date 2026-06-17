from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_active_user
from app.core.database import get_db
from app.models.progress import Progress as ProgressModel
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.progress import ProgressCreate, Progress as ProgressSchema

router = APIRouter()


@router.get("/", response_model=List[ProgressSchema])
def read_progress(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Retrieve progress for current user.
    """
    progress_records = db.query(ProgressModel, Quiz.title.label('quiz_title')).join(Quiz, ProgressModel.quiz_id == Quiz.id).filter(ProgressModel.user_id == current_user.id).all()
    return [{"id": p.id, "user_id": p.user_id, "quiz_id": p.quiz_id, "score": p.score, "date_taken": p.date_taken, "quiz_title": quiz_title} for p, quiz_title in progress_records]


@router.post("/", response_model=ProgressSchema)
def create_progress(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    progress_in: ProgressCreate
) -> Any:
    """
    Create new progress record.
    """
    # Check if quiz exists and belongs to user
    quiz = db.query(Quiz).filter(Quiz.id == progress_in.quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    progress = ProgressModel(
        user_id=current_user.id,
        quiz_id=progress_in.quiz_id,
        score=progress_in.score,
        date_taken=progress_in.date_taken
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress


@router.get("/{progress_id}", response_model=ProgressSchema)
def read_single_progress(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    progress_id: int
) -> Any:
    """
    Get progress by ID.
    """
    progress = db.query(ProgressModel).filter(ProgressModel.id == progress_id, ProgressModel.user_id == current_user.id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")
    return progress
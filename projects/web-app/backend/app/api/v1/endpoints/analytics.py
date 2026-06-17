from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.models.agenda import Agenda
from app.models.quiz import Quiz
from app.models.progress import Progress

router = APIRouter()


@router.get("/dashboard")
def get_analytics_dashboard(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get analytics dashboard data for current user.
    """
    # Get user's stats
    agendas_count = db.query(Agenda).filter(Agenda.user_id == current_user.id).count()
    quizzes_count = db.query(Quiz).filter(Quiz.user_id == current_user.id).count()
    progress_count = db.query(Progress).filter(Progress.user_id == current_user.id).count()

    return {
        "total_agendas": agendas_count,
        "total_quizzes": quizzes_count,
        "total_progress_entries": progress_count,
        "user_role": current_user.role
    }
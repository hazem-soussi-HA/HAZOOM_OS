from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_active_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema

router = APIRouter()


@router.get("/me")
def read_user_me(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get current user.
    """
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "is_active": current_user.is_active,
            "is_superuser": current_user.is_superuser,
        }
    }
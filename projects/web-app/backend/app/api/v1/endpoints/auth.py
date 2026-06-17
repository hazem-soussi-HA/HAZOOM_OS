from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
import logging
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.token import Token, RegisterResponse
from app.schemas.user import UserCreate

router = APIRouter()

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/access-token", auto_error=False)


@router.post("/register", response_model=RegisterResponse)
def register(*, db: Session = Depends(get_db), user_in: UserCreate) -> Any:
    """
    Register a new user.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, role=user.role, expires_delta=access_token_expires
    )
    return {"user": {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role, "is_active": user.is_active, "is_superuser": user.is_superuser}, "access_token": access_token, "token_type": "bearer"}


@router.post("/access-token", response_model=RegisterResponse)
def login_access_token(
    response: Response,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        logger.debug(f"Login failed: user not found for email={form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    # verify password
    password_ok = security.verify_password(form_data.password, user.hashed_password)
    if not password_ok:
        # Log hashed password and a short marker for debugging (do not log plain password)
        logger.debug(f"Login failed: password mismatch for user id={user.id} email={user.email} hashed={user.hashed_password[:20]}...")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # include role when creating token (security.create_access_token requires role)
    access_token = security.create_access_token(
        user.id, role=user.role, expires_delta=access_token_expires
    )
    # set cookie (use integer seconds)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=int(access_token_expires.total_seconds()),
    )
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
        },
        "access_token": access_token,
        "token_type": "bearer",
    }


def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Cookie(None, alias="access_token"),
    authorization: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try to get token from cookie first, then from Authorization header
    auth_token = token or authorization
    
    if auth_token is None:
        raise credentials_exception
    
    try:
        payload = security.jwt.decode(auth_token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except security.JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud.theme import theme
from app.schemas.theme import Theme as ThemeSchema, ThemeCreate, ThemeUpdate

router = APIRouter()


@router.get("/", response_model=List[ThemeSchema])
def read_themes(
    db: Session = Depends(get_db), skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve themes.
    """
    themes = theme.get_multi(db, skip=skip, limit=limit)
    return themes


@router.post("/", response_model=ThemeSchema)
def create_theme(
    *,
    db: Session = Depends(get_db),
    theme_in: ThemeCreate,
) -> Any:
    """
    Create new theme.
    """
    theme_obj = theme.get_by_name(db, name=theme_in.name)
    if theme_obj:
        raise HTTPException(
            status_code=400,
            detail="Theme with this name already exists.",
        )
    theme_obj = theme.create(db, obj_in=theme_in)
    return theme_obj


@router.put("/{theme_id}", response_model=ThemeSchema)
def update_theme(
    *,
    db: Session = Depends(get_db),
    theme_id: int,
    theme_in: ThemeUpdate,
) -> Any:
    """
    Update a theme.
    """
    theme_obj = theme.get(db, id=theme_id)
    if not theme_obj:
        raise HTTPException(status_code=404, detail="Theme not found")
    theme_obj = theme.update(db, db_obj=theme_obj, obj_in=theme_in)
    return theme_obj


@router.get("/{theme_id}", response_model=ThemeSchema)
def read_theme(
    *,
    db: Session = Depends(get_db),
    theme_id: int,
) -> Any:
    """
    Get theme by ID.
    """
    theme_obj = theme.get(db, id=theme_id)
    if not theme_obj:
        raise HTTPException(status_code=404, detail="Theme not found")
    return theme_obj


@router.delete("/{theme_id}", response_model=ThemeSchema)
def delete_theme(
    *,
    db: Session = Depends(get_db),
    theme_id: int,
) -> Any:
    """
    Delete a theme.
    """
    theme_obj = theme.get(db, id=theme_id)
    if not theme_obj:
        raise HTTPException(status_code=404, detail="Theme not found")
    theme_obj = theme.remove(db, id=theme_id)
    return theme_obj
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_active_user
from app.core.database import get_db
from app.models.agenda import Agenda as AgendaModel
from app.models.user import User
from app.schemas.agenda import AgendaCreate, AgendaUpdate, Agenda as AgendaSchema

router = APIRouter()


@router.get("/", response_model=List[AgendaSchema])
def read_agendas(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Retrieve agendas for current user.
    """
    return db.query(AgendaModel).filter(AgendaModel.user_id == current_user.id).all()


@router.post("/", response_model=AgendaSchema)
def create_agenda(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    agenda_in: AgendaCreate
) -> Any:
    """
    Create new agenda.
    """
    agenda = AgendaModel(
        title=agenda_in.title,
        description=agenda_in.description,
        date=agenda_in.date,
        user_id=current_user.id
    )
    db.add(agenda)
    db.commit()
    db.refresh(agenda)
    return agenda


@router.get("/{agenda_id}", response_model=AgendaSchema)
def read_agenda(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    agenda_id: int
) -> Any:
    """
    Get agenda by ID.
    """
    agenda = db.query(AgendaModel).filter(AgendaModel.id == agenda_id, AgendaModel.user_id == current_user.id).first()
    if not agenda:
        raise HTTPException(status_code=404, detail="Agenda not found")
    return agenda


@router.put("/{agenda_id}", response_model=AgendaSchema)
def update_agenda(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    agenda_id: int,
    agenda_in: AgendaUpdate
) -> Any:
    """
    Update an agenda.
    """
    agenda = db.query(AgendaModel).filter(AgendaModel.id == agenda_id, AgendaModel.user_id == current_user.id).first()
    if not agenda:
        raise HTTPException(status_code=404, detail="Agenda not found")
    update_data = agenda_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agenda, field, value)
    db.commit()
    db.refresh(agenda)
    return agenda


@router.delete("/{agenda_id}")
def delete_agenda(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    agenda_id: int
) -> Any:
    """
    Delete an agenda.
    """
    agenda = db.query(AgendaModel).filter(AgendaModel.id == agenda_id, AgendaModel.user_id == current_user.id).first()
    if not agenda:
        raise HTTPException(status_code=404, detail="Agenda not found")
    db.delete(agenda)
    db.commit()
    return {"message": "Agenda deleted successfully"}
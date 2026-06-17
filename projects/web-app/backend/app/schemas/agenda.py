from datetime import date
from pydantic import BaseModel
from typing import Optional


class AgendaBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: date


class AgendaCreate(AgendaBase):
    pass


class AgendaUpdate(AgendaBase):
    pass


class Agenda(AgendaBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
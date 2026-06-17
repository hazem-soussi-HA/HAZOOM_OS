from datetime import date
from pydantic import BaseModel


class ProgressBase(BaseModel):
    score: float
    date_taken: date


class ProgressCreate(ProgressBase):
    quiz_id: int


class Progress(ProgressBase):
    id: int
    user_id: int
    quiz_id: int
    quiz_title: str

    class Config:
        from_attributes = True
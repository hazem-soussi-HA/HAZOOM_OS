from pydantic import BaseModel
from typing import List, Optional


class QuestionBase(BaseModel):
    question_text: str
    options: str  # JSON string
    correct_answer: str


class QuestionCreate(QuestionBase):
    pass


class Question(QuestionBase):
    id: int
    quiz_id: int

    class Config:
        from_attributes = True


class QuizBase(BaseModel):
    title: str
    subject: str


class QuizCreate(QuizBase):
    questions: Optional[List[QuestionCreate]] = None


class QuizUpdate(QuizBase):
    pass


class Quiz(QuizBase):
    id: int
    user_id: int
    questions: List[Question] = []

    class Config:
        from_attributes = True
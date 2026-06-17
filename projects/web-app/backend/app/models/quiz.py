from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz")
    progress = relationship("Progress", back_populates="quiz")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(String, nullable=False)
    options = Column(String, nullable=False)  # JSON string of options
    correct_answer = Column(String, nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # e.g., "student", "teacher", "admin"
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Relationships
    agendas = relationship("Agenda", back_populates="user")
    quizzes = relationship("Quiz", back_populates="user")
    progress = relationship("Progress", back_populates="user")
from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Theme(Base):
    __tablename__ = "themes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    config = Column(JSON, nullable=False)  # Store the theme config as JSON
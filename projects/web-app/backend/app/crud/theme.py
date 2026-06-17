from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.theme import Theme
from app.schemas.theme import ThemeCreate, ThemeUpdate


class CRUDTheme:
    def get(self, db: Session, *, id: int) -> Optional[Theme]:
        return db.query(Theme).filter(Theme.id == id).first()

    def get_by_name(self, db: Session, *, name: str) -> Optional[Theme]:
        return db.query(Theme).filter(Theme.name == name).first()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Theme]:
        return db.query(Theme).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: ThemeCreate) -> Theme:
        db_obj = Theme(
            name=obj_in.name,
            config=obj_in.config,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Theme, obj_in: ThemeUpdate) -> Theme:
        update_data = obj_in.dict(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> Theme:
        obj = db.query(Theme).get(id)
        db.delete(obj)
        db.commit()
        return obj


theme = CRUDTheme()
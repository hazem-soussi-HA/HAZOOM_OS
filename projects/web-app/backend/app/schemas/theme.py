from pydantic import BaseModel


class ThemeBase(BaseModel):
    name: str
    config: dict


class ThemeCreate(ThemeBase):
    pass


class ThemeUpdate(ThemeBase):
    pass


class Theme(ThemeBase):
    id: int

    class Config:
        from_attributes = True
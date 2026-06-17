from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str


class UserCreate(UserBase):
    password: str


class UserUpdate(UserBase):
    pass


class User(UserBase):
    id: int
    is_active: bool
    is_superuser: bool

    class Config:
        from_attributes = True


class UserInDB(User):
    hashed_password: str
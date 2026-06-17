from pydantic import BaseModel 
  
from .user import User  
  
class Token(BaseModel):  
    access_token: str  
    token_type: str  
  
class TokenData(BaseModel):  
    email: str | None = None  
  
class RegisterResponse(BaseModel):  
    user: User  
    access_token: str  
    token_type: str 

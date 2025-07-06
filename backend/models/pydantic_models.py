from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
    username: str
    email: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    image: Optional[str] = None


class ProductCreate(BaseModel):
    name: str
    price: float
    description: Optional[str] = ""


class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    description: Optional[str] = None
    image: Optional[str] = None

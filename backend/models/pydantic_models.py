from pydantic import BaseModel
from typing import Optional
from enum import Enum


class ImageType(str, Enum):
    FRONT = "front"
    SIDE = "side"


class UserCreate(BaseModel):
    username: str
    email: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    image: Optional[str] = None


class UserImageCreate(BaseModel):
    user_id: int
    image_type: ImageType
    image_url: str


class UserImageResponse(BaseModel):
    id: int
    user_id: int
    image_type: ImageType
    image_url: str


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

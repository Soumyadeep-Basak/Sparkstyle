import os
import uuid
import shutil
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta

from database import get_db, User, UserImage
from models import UserCreate, UserResponse, UserImageCreate, UserImageResponse, ImageType, UserLogin
from utils.cloudinary_utils import upload_and_save_user_image

router = APIRouter()

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "your_secret_key_here"  # Replace with a secure key in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered.")
    hashed_password = pwd_context.hash(user.password)
    db_user = User(username=user.username, email=user.email, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/", response_model=List[UserResponse])
async def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@router.post("/{user_id}/upload_image")
async def upload_user_image(user_id: int, image: UploadFile = File(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not allowed_file(image.filename):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    file_extension = image.filename.split('.')[-1]
    filename = f"user_{user_id}_{uuid.uuid4().hex}.{file_extension}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    image.file.seek(0)
    
    user.image = filename
    db.commit()
    return {"message": "Image uploaded", "image": filename}

@router.post("/{user_id}/upload_body_image", response_model=UserImageResponse)
async def upload_user_body_image(
    user_id: int, 
    image_type: ImageType, 
    image: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not allowed_file(image.filename):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    folder = f"users/{user_id}/body_images"
    result = upload_and_save_user_image(image, user_id, image_type, db, folder)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to upload image")
    
    return result

@router.get("/{user_id}/images", response_model=List[UserImageResponse])
async def get_user_images(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    images = db.query(UserImage).filter(UserImage.user_id == user_id).all()
    return images

@router.post("/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # Create JWT token
    to_encode = {
        "sub": str(db_user.id),
        "username": db_user.username,
        "email": db_user.email,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "user": {"id": db_user.id, "username": db_user.username, "email": db_user.email}}

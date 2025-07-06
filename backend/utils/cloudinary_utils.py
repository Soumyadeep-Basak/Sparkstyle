import os
import cloudinary
from cloudinary.uploader import upload as cloudinary_upload
from dotenv import load_dotenv
from fastapi import UploadFile
from sqlalchemy.orm import Session
from models.pydantic_models import ImageType

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_image_to_cloudinary(file: UploadFile, folder: str = None):
    try:
        file.file.seek(0)
        upload_options = {"resource_type": "image"}
        if folder:
            upload_options["folder"] = folder
        result = cloudinary_upload(file.file, **upload_options)
        return result.get("secure_url")
    except Exception:
        return None


def upload_and_save_user_image(file: UploadFile, user_id: int, image_type: ImageType, db: Session, folder: str = None):
    try:
        from database import UserImage
        
        image_url = upload_image_to_cloudinary(file, folder)
        if not image_url:
            return None
        
        user_image = UserImage(
            user_id=user_id,
            image_type=image_type,
            image_url=image_url
        )
        db.add(user_image)
        db.commit()
        db.refresh(user_image)
        
        return {
            "id": user_image.id,
            "user_id": user_image.user_id,
            "image_type": user_image.image_type,
            "image_url": user_image.image_url
        }
    except Exception:
        db.rollback()
        return None 
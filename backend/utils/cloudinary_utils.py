import os
import cloudinary
from cloudinary.uploader import upload as cloudinary_upload
from dotenv import load_dotenv
from fastapi import UploadFile
from sqlalchemy.orm import Session
from models.pydantic_models import ImageType
import hashlib
import time

load_dotenv()

# Simple cache to avoid re-uploading the same image during a session
# Structure: {file_hash: {"url": cloudinary_url, "timestamp": upload_time}}
UPLOAD_CACHE = {}
CACHE_TTL = 3600  # Cache TTL in seconds (1 hour)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def get_file_hash(file_content):
    """Create a hash of file content to identify duplicates"""
    return hashlib.md5(file_content).hexdigest()

def upload_image_to_cloudinary(file: UploadFile, folder: str = None):
    try:
        # Ensure file position is at the beginning
        file.file.seek(0)
        
        # Read file content for hashing
        file_content = file.file.read()
        file_hash = get_file_hash(file_content)
        
        # Check cache for this file hash
        current_time = time.time()
        if file_hash in UPLOAD_CACHE:
            cache_item = UPLOAD_CACHE[file_hash]
            # If cache is still valid
            if current_time - cache_item["timestamp"] < CACHE_TTL:
                print(f"[Cloudinary] Using cached URL for {file.filename}: {cache_item['url']}")
                return cache_item["url"]
        
        # Create new BytesIO for upload since we read the file already
        import io
        file_io = io.BytesIO(file_content)
        
        upload_options = {"resource_type": "image"}
        if folder:
            upload_options["folder"] = folder
            
        # Add unique public_id to prevent overwrites
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        upload_options["public_id"] = f"{unique_id}_{file.filename.split('.')[0]}"
        
        result = cloudinary_upload(file_io, **upload_options)
        secure_url = result.get("secure_url")
        
        # Cache the result
        UPLOAD_CACHE[file_hash] = {
            "url": secure_url,
            "timestamp": current_time
        }
        
        print(f"[Cloudinary Upload] {file.filename} => {secure_url}")
        return secure_url
    except Exception as e:
        # More detailed error logging
        import traceback
        error_details = traceback.format_exc()
        print(f"[Cloudinary Upload Error] {e}")
        print(f"[Error Details] {error_details}")
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
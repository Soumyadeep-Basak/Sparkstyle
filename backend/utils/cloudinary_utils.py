import os
import cloudinary
from cloudinary.uploader import upload as cloudinary_upload
from dotenv import load_dotenv
from fastapi import UploadFile

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_image_to_cloudinary(file: UploadFile, folder: str = None):
    # This is a sync function, so use in background tasks
    try:
        file.file.seek(0)
        upload_options = {"resource_type": "image"}
        if folder:
            upload_options["folder"] = folder
        result = cloudinary_upload(file.file, **upload_options)
        return result.get("secure_url")
    except Exception as e:
        return None 
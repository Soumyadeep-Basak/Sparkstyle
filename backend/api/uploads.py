import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')

@router.get("/{filename}")
async def uploaded_file(filename: str):
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath)

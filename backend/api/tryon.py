import os
import subprocess
import base64
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from tempfile import NamedTemporaryFile
from sqlalchemy.orm import Session
from database import get_db, UserImage, Product
from models.pydantic_models import ImageType

router = APIRouter()

@router.post("/")
async def tryon_endpoint(
    user_id: int = Form(...),
    garment_image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user_front_image = db.query(UserImage).filter(
        UserImage.user_id == user_id,
        UserImage.image_type == ImageType.FRONT
    ).first()
    if not user_front_image:
        raise HTTPException(status_code=404, detail="User front image not found")
    person_path = user_front_image.image_url
    if not os.path.exists(person_path):
        raise HTTPException(status_code=404, detail="Front image file not found on server")

    with NamedTemporaryFile(delete=False, suffix=".jpg") as garment_tmp:
        garment_path = garment_tmp.name
        garment_tmp.write(await garment_image.read())

    output_path = garment_path.replace(".jpg", "_tryon.jpg")

    try:
        result = subprocess.run([
            "python", os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "tryon", "main.py"),
            "--person_path", person_path,
            "--garment_path", garment_path,
            "--output_path", output_path
        ], capture_output=True, text=True)
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Tryon subprocess failed: {result.stderr}")
        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Tryon output image not found.")
        return FileResponse(path=output_path, filename="tryon_result.jpg", media_type="image/jpeg")
    finally:
        if os.path.exists(garment_path):
            os.remove(garment_path)

@router.post("/product")
async def tryon_with_product(
    user_id: int = Form(...),
    product_id: int = Form(...),
    db: Session = Depends(get_db)
):
    user_front_image = db.query(UserImage).filter(
        UserImage.user_id == user_id,
        UserImage.image_type == ImageType.FRONT
    ).first()
    if not user_front_image:
        raise HTTPException(status_code=404, detail="User front image not found")
    person_path = user_front_image.image_url
    if not os.path.exists(person_path):
        raise HTTPException(status_code=404, detail="Front image file not found on server")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product or not product.image:
        raise HTTPException(status_code=404, detail="Product or product image not found")
    
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    garment_path = os.path.join(uploads_dir, product.image)
    if not os.path.exists(garment_path):
        raise HTTPException(status_code=404, detail="Product image file not found on server")

    with NamedTemporaryFile(delete=False, suffix=".jpg") as output_tmp:
        output_path = output_tmp.name

    try:
        result = subprocess.run([
            "python", os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "tryon", "main.py"),
            "--person_path", person_path,
            "--garment_path", garment_path,
            "--output_path", output_path
        ], capture_output=True, text=True)
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Tryon subprocess failed: {result.stderr}")
        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Tryon output image not found.")
        
        with open(output_path, "rb") as img_file:
            img_base64 = base64.b64encode(img_file.read()).decode()
        
        return {"image_base64": img_base64}
    finally:
        if os.path.exists(output_path):
            os.remove(output_path) 
import os
import uuid
import shutil
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db, Product
from models import ProductCreate, ProductResponse

router = APIRouter()

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@router.post("/", response_model=ProductResponse)
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(name=product.name, price=product.price, description=product.description)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/", response_model=List[ProductResponse])
async def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return products

@router.post("/{product_id}/upload_image")
async def upload_product_image(product_id: int, image: UploadFile = File(...), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not allowed_file(image.filename):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    file_extension = image.filename.split('.')[-1]
    filename = f"product_{product_id}_{uuid.uuid4().hex}.{file_extension}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    product.image = filename
    db.commit()
    return {"message": "Image uploaded", "image": filename}

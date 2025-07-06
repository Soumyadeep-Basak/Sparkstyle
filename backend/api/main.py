from fastapi import APIRouter
from .users import router as users_router
from .products import router as products_router
from .body_measure import router as body_measure_router
from .uploads import router as uploads_router

api_router = APIRouter()

api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(body_measure_router, prefix="/body-measure", tags=["body-measure"])
api_router.include_router(uploads_router, prefix="/uploads", tags=["uploads"])

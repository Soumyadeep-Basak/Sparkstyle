from fastapi import APIRouter, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from backend.services.body_measure_service import (
    predict_mediapipe_service,
    predict_yolo_service,
    detect_fullbody_service,
    predict_avg_service
)

router = APIRouter()

@router.post("/predict-mediapipe")
async def predict_mediapipe(
    front: UploadFile = File(...),
    side: UploadFile = File(...),
    height: int = Form(...),
    weight: int = Form(None),
    gender: str = Form(None)
):
    return await predict_mediapipe_service(front, side, height, weight, gender)

@router.post("/predict-yolo")
async def predict_yolo(
    front: UploadFile = File(...),
    side: UploadFile = File(...),
    height: int = Form(...),
    weight: int = Form(None),
    gender: str = Form(None)
):
    return await predict_yolo_service(front, side, height, weight, gender)

@router.post("/detect-fullbody")
async def detect_fullbody(
    image: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    return await detect_fullbody_service(image, background_tasks)

@router.post("/predict-avg")
async def predict_avg(
    front: UploadFile = File(...),
    side: UploadFile = File(...),
    height: int = Form(...),
    weight: int = Form(None),
    gender: str = Form(None)
):
    return await predict_avg_service(front, side, height, weight, gender) 
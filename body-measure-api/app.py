from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import numpy as np
import cv2
from ultralytics import YOLO
import mediapipe as mp
import math

app = FastAPI(title="Body Measurement API")

model = YOLO("weights/yolov8n-pose.pt")
mp_pose = mp.solutions.pose.Pose(static_image_mode=True, model_complexity=2)

def cm_to_inch(cm):
    return round(cm / 2.54, 1)

def parse_image(file: UploadFile):
    data = file.file.read()
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    file.file.close()
    return img

def dist(a, b):
    return float(np.linalg.norm(np.array(a) - np.array(b)))

def ellipse_circumference(width, depth):
    # width, depth are full lengths in cm
    a, b = width / 2, depth / 2
    return 2 * math.pi * math.sqrt((a ** 2 + b ** 2) / 2)

def compute_metrics(lm_f, lm_s, scale):
    # Extract widths from front, depths from side
    shoulder_w = dist(lm_f['ls'], lm_f['rs']) * scale
    hip_w = dist(lm_f['lh'], lm_f['rh']) * scale
    inseam = dist(lm_f['lh'], lm_f['la']) * scale

    chest_d = dist(lm_s['sc'], lm_s['bc']) * scale  # Side chest depth
    waist_d = dist(lm_s['sh'], lm_s['bh']) * scale  # Side waist depth

    chest = ellipse_circumference(shoulder_w, chest_d)
    waist = ellipse_circumference(hip_w, waist_d)

    return {
        "shoulder_cm": round(shoulder_w, 1),
        "shoulder_in": cm_to_inch(shoulder_w),
        "chest_cm": round(chest, 1),
        "chest_in": cm_to_inch(chest),
        "waist_cm": round(waist, 1),
        "waist_in": cm_to_inch(waist),
        "inseam_cm": round(inseam, 1),
        "inseam_in": cm_to_inch(inseam),
    }

@app.post("/predict-yolo")
async def predict_yolo(
    front: UploadFile = File(...),
    side: UploadFile = File(...),
    height: int = Form(...),
    weight: int = Form(...),
    gender: str = Form(...)
):
    try:
        img_f = parse_image(front)
        img_s = parse_image(side)

        res_f = model.predict(source=img_f, imgsz=640, verbose=False)
        res_s = model.predict(source=img_s, imgsz=640, verbose=False)

        if not res_f or not hasattr(res_f[0], "keypoints") or res_f[0].keypoints is None:
            return JSONResponse(status_code=400, content={"error": "No person detected in front image"})
        if not res_s or not hasattr(res_s[0], "keypoints") or res_s[0].keypoints is None:
            return JSONResponse(status_code=400, content={"error": "No person detected in side image"})

        kp_f = res_f[0].keypoints.xy[0]
        kp_s = res_s[0].keypoints.xy[0]

        lm_f = {
            'ls': kp_f[5][:2].tolist(), 'rs': kp_f[6][:2].tolist(),
            'lh': kp_f[11][:2].tolist(), 'rh': kp_f[12][:2].tolist(),
            'la': kp_f[15][:2].tolist()
        }
        lm_s = {
            'sc': kp_s[6][:2].tolist(),   # shoulder chest depth (right shoulder)
            'bc': kp_s[12][:2].tolist(),  # chest depth bottom (right hip)
            'sh': kp_s[11][:2].tolist(),  # left hip for waist depth
            'bh': kp_s[15][:2].tolist()   # left ankle for waist depth bottom
        }

        pixel_h = dist(kp_f[0][:2], kp_f[15][:2])
        scale = height / pixel_h if pixel_h > 0 else 1

        result = compute_metrics(lm_f, lm_s, scale)
        result.update({"gender": gender.lower(), "height_cm": height, "weight_kg": weight})

        return JSONResponse(content=result)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/predict-mediapipe")
async def predict_mediapipe(
    front: UploadFile = File(...),
    side: UploadFile = File(...),
    height: int = Form(...),
    weight: int = Form(...),
    gender: str = Form(...)
):
    try:
        img_f = parse_image(front)
        img_s = parse_image(side)

        res_f = mp_pose.process(cv2.cvtColor(img_f, cv2.COLOR_BGR2RGB))
        res_s = mp_pose.process(cv2.cvtColor(img_s, cv2.COLOR_BGR2RGB))

        if not res_f.pose_landmarks:
            return JSONResponse(status_code=400, content={"error": "No person detected in front image"})
        if not res_s.pose_landmarks:
            return JSONResponse(status_code=400, content={"error": "No person detected in side image"})

        lmk_f = res_f.pose_landmarks.landmark
        lmk_s = res_s.pose_landmarks.landmark

        def get_xy(lm, idx, shape): return [lm[idx].x * shape[1], lm[idx].y * shape[0]]

        lm_f = {
            'ls': get_xy(lmk_f, 11, img_f.shape),  # left shoulder
            'rs': get_xy(lmk_f, 12, img_f.shape),  # right shoulder
            'lh': get_xy(lmk_f, 23, img_f.shape),  # left hip
            'rh': get_xy(lmk_f, 24, img_f.shape),  # right hip
            'la': get_xy(lmk_f, 27, img_f.shape)   # left ankle
        }
        lm_s = {
            'sc': get_xy(lmk_s, 12, img_s.shape),  # shoulder depth
            'bc': get_xy(lmk_s, 24, img_s.shape),  # chest depth
            'sh': get_xy(lmk_s, 23, img_s.shape),  # waist depth
            'bh': get_xy(lmk_s, 27, img_s.shape),  # bottom
        }

        pixel_h = dist(get_xy(lmk_f, 0, img_f.shape), get_xy(lmk_f, 27, img_f.shape))
        scale = height / pixel_h if pixel_h > 0 else 1

        result = compute_metrics(lm_f, lm_s, scale)
        result.update({"gender": gender.lower(), "height_cm": height, "weight_kg": weight})

        return JSONResponse(content=result)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

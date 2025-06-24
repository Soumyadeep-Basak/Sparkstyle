from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import numpy as np
import cv2
from ultralytics import YOLO
import mediapipe as mp

app = FastAPI()

# --- Models ---
yolo_model = YOLO("weights/yolov8m-pose.pt")  # Use yolov8m-pose.pt for better accuracy
mp_pose = mp.solutions.pose
pose_detector = mp_pose.Pose(static_image_mode=True)

# --- Utils ---
def parse_image(file: UploadFile):
    data = file.file.read()
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    file.file.close()
    return image

def cm_to_inch(cm):
    return round(cm / 2.54, 1)

def distance(p1, p2):
    return np.linalg.norm(np.array(p1) - np.array(p2))

def elliptical_circumference(width, depth):
    a, b = width / 2, depth / 2
    h = ((a - b)**2) / ((a + b)**2 + 1e-5)
    return np.pi * (a + b) * (1 + (3 * h) / (10 + np.sqrt(4 - 3 * h)))

# --- MediaPipe Logic ---
@app.post("/predict-mediapipe")
async def predict_mediapipe(
    front: UploadFile = File(...),
    side: UploadFile = File(...),
    height: int = Form(...),
    weight: int = Form(...),
    gender: str = Form(...)
):
    try:
        front_img = parse_image(front)
        side_img = parse_image(side)

        front_rgb = cv2.cvtColor(front_img, cv2.COLOR_BGR2RGB)
        side_rgb = cv2.cvtColor(side_img, cv2.COLOR_BGR2RGB)

        front_result = pose_detector.process(front_rgb)
        side_result = pose_detector.process(side_rgb)

        if not front_result.pose_landmarks:
            return JSONResponse(status_code=400, content={"error": "No person detected in front image"})

        lm_f = front_result.pose_landmarks.landmark
        lm_s = side_result.pose_landmarks.landmark if side_result.pose_landmarks else None
        H, W, _ = front_img.shape

        def xy(landmark): return np.array([landmark.x * W, landmark.y * H])

        # Measurements
        shoulder_px = distance(xy(lm_f[mp_pose.PoseLandmark.LEFT_SHOULDER]), xy(lm_f[mp_pose.PoseLandmark.RIGHT_SHOULDER]))
        chest_px = shoulder_px  # Approx same
        waist_px = distance(xy(lm_f[mp_pose.PoseLandmark.LEFT_HIP]), xy(lm_f[mp_pose.PoseLandmark.RIGHT_HIP]))
        inseam_px = distance(xy(lm_f[mp_pose.PoseLandmark.LEFT_HIP]), xy(lm_f[mp_pose.PoseLandmark.LEFT_ANKLE]))
        height_px = distance(xy(lm_f[mp_pose.PoseLandmark.NOSE]), xy(lm_f[mp_pose.PoseLandmark.LEFT_HEEL]))
        scale = height / height_px if height_px > 0 else 1

        chest_depth_px, waist_depth_px = 0, 0
        if lm_s:
            chest_depth_px = distance(
                xy(lm_s[mp_pose.PoseLandmark.LEFT_SHOULDER]),
                xy(lm_s[mp_pose.PoseLandmark.LEFT_HIP])
            ) * 0.6
            waist_depth_px = distance(
                xy(lm_s[mp_pose.PoseLandmark.LEFT_HIP]),
                xy(lm_s[mp_pose.PoseLandmark.LEFT_KNEE])
            ) * 0.5

        shoulder_cm = shoulder_px * scale
        chest_cm = elliptical_circumference(chest_px, chest_depth_px) * scale
        waist_cm = elliptical_circumference(waist_px, waist_depth_px) * scale
        inseam_cm = inseam_px * scale

        return {
            "shoulder_cm": round(shoulder_cm, 1),
            "shoulder_in": cm_to_inch(shoulder_cm),
            "chest_cm": round(chest_cm, 1),
            "chest_in": cm_to_inch(chest_cm),
            "waist_cm": round(waist_cm, 1),
            "waist_in": cm_to_inch(waist_cm),
            "inseam_cm": round(inseam_cm, 1),
            "inseam_in": cm_to_inch(inseam_cm),
            "gender": gender.lower(),
            "height_cm": height,
            "weight_kg": weight
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- YOLOv8 Logic ---
@app.post("/predict-yolo")
async def predict_yolo(
    front: UploadFile = File(...),
    side: UploadFile = File(...),
    height: int = Form(...),
    weight: int = Form(...),
    gender: str = Form(...)
):
    try:
        front_img = parse_image(front)
        side_img = parse_image(side)

        front_res = yolo_model.predict(source=front_img, imgsz=640, verbose=False)
        side_res = yolo_model.predict(source=side_img, imgsz=640, verbose=False)

        kp_f = front_res[0].keypoints.xy[0]
        kp_s = side_res[0].keypoints.xy[0] if hasattr(side_res[0], "keypoints") and side_res[0].keypoints is not None else None

        lm_f = {
            'ls': kp_f[5].tolist(),
            'rs': kp_f[6].tolist(),
            'lh': kp_f[11].tolist(),
            'rh': kp_f[12].tolist(),
            'la': kp_f[15].tolist()
        }

        shoulder_px = distance(lm_f['ls'], lm_f['rs'])
        chest_px = shoulder_px
        waist_px = distance(lm_f['lh'], lm_f['rh'])
        inseam_px = distance(lm_f['lh'], lm_f['la'])
        height_px = distance(kp_f[0], kp_f[15])
        scale = height / height_px if height_px > 0 else 1

        chest_depth_px, waist_depth_px = 0, 0
        if kp_s is not None:
            chest_depth_px = distance(kp_s[5], kp_s[11]) * 0.6
            waist_depth_px = distance(kp_s[11], kp_s[13]) * 0.5

        shoulder_cm = shoulder_px * scale
        chest_cm = elliptical_circumference(chest_px, chest_depth_px) * scale
        waist_cm = elliptical_circumference(waist_px, waist_depth_px) * scale
        inseam_cm = inseam_px * scale

        return {
            "shoulder_cm": round(shoulder_cm, 1),
            "shoulder_in": cm_to_inch(shoulder_cm),
            "chest_cm": round(chest_cm, 1),
            "chest_in": cm_to_inch(chest_cm),
            "waist_cm": round(waist_cm, 1),
            "waist_in": cm_to_inch(waist_cm),
            "inseam_cm": round(inseam_cm, 1),
            "inseam_in": cm_to_inch(inseam_cm),
            "gender": gender.lower(),
            "height_cm": height,
            "weight_kg": weight
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

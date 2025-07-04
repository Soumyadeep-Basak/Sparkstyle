from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import numpy as np
import cv2
from ultralytics import YOLO
import mediapipe as mp
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    weight: int = Form(None),
    gender: str = Form(None)
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
            "gender": gender.lower() if gender else None,
            "height_cm": height,
            "weight_kg": weight if weight is not None else None
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- YOLOv8 Logic ---
@app.post("/predict-yolo")
async def predict_yolo(
    front: UploadFile = File(...),
    side: UploadFile = File(...),
    height: int = Form(...),
    weight: int = Form(None),
    gender: str = Form(None)
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
            "gender": gender.lower() if gender else None,
            "height_cm": height,
            "weight_kg": weight if weight is not None else None
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- Full Body Detection with MediaPipe Holistic ---
@app.post("/detect-fullbody")
async def detect_fullbody(
    image: UploadFile = File(...)
):
    try:
        img = parse_image(image)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_holistic = mp.solutions.holistic
        with mp_holistic.Holistic(static_image_mode=True, min_detection_confidence=0.5) as holistic:
            results = holistic.process(img_rgb)
            # Check for pose landmarks (full body)
            pose_landmarks = results.pose_landmarks
            # Heuristic: if enough pose landmarks are detected, assume full body is present
            if pose_landmarks and len(pose_landmarks.landmark) >= 30:
                # Optionally, check for feet/ankle/shoulder/nose presence for more strictness
                required = [mp_holistic.PoseLandmark.LEFT_ANKLE, mp_holistic.PoseLandmark.RIGHT_ANKLE,
                            mp_holistic.PoseLandmark.LEFT_SHOULDER, mp_holistic.PoseLandmark.RIGHT_SHOULDER,
                            mp_holistic.PoseLandmark.NOSE]
                visible = all(pose_landmarks.landmark[lm].visibility > 0.5 for lm in required)
                if visible:
                    return {"full_body": True, "message": "Full body detected"}
                else:
                    return {"full_body": False, "message": "Person detected, but not full body (some keypoints missing)"}
            else:
                return {"full_body": False, "message": "No full body detected"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/predict-avg")
async def predict_avg(
    front: UploadFile = File(...),
    side: UploadFile = File(...),
    height: int = Form(...),
    weight: int = Form(None),
    gender: str = Form(None)
):
    try:
        import io
        # Read file bytes once
        front_bytes = await front.read()
        side_bytes = await side.read()
        
        # Helper to create UploadFile from bytes
        def make_uploadfile(filename, bytes_data):
            file_obj = io.BytesIO(bytes_data)
            # Create UploadFile with proper parameters
            upload_file = UploadFile(file=file_obj, filename=filename)
            return upload_file
        
        # Create new UploadFile objects for each call
        front1 = make_uploadfile(front.filename, front_bytes)
        side1 = make_uploadfile(side.filename, side_bytes)
        front2 = make_uploadfile(front.filename, front_bytes)
        side2 = make_uploadfile(side.filename, side_bytes)
        # Call both functions
        mediapipe_res = await predict_mediapipe(front=front1, side=side1, height=height, weight=weight, gender=gender)
        yolo_res = await predict_yolo(front=front2, side=side2, height=height, weight=weight, gender=gender)
        # If either is a JSONResponse (error), return error
        if isinstance(mediapipe_res, JSONResponse):
            return mediapipe_res
        if isinstance(yolo_res, JSONResponse):
            return yolo_res
        # Average numeric fields
        fields = [
            "shoulder_cm", "shoulder_in", "chest_cm", "chest_in",
            "waist_cm", "waist_in", "inseam_cm", "inseam_in"
        ]
        avg_result = {}
        for f in fields:
            v1 = mediapipe_res.get(f)
            v2 = yolo_res.get(f)
            if v1 is not None and v2 is not None:
                avg_result[f] = round((v1 + v2) / 2, 1)
            else:
                avg_result[f] = v1 if v1 is not None else v2
        # Add gender, height_cm, weight_kg
        avg_result["gender"] = mediapipe_res.get("gender") or yolo_res.get("gender")
        avg_result["height_cm"] = mediapipe_res.get("height_cm") or yolo_res.get("height_cm")
        avg_result["weight_kg"] = mediapipe_res.get("weight_kg") or yolo_res.get("weight_kg")
        return {
            "average": avg_result,
            "mediapipe": mediapipe_res,
            "yolo": yolo_res
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

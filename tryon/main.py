from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
import base64
import time
import os

# Set up FastAPI
app = FastAPI()

# Get current directory (tryon/)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# Load .env from Sparkathon/.env
ENV_PATH = os.path.abspath(os.path.join(CURRENT_DIR, "../.env"))
load_dotenv(dotenv_path=ENV_PATH)

API_KEY = os.getenv("API_KEY")

# Default paths for local testing
DEFAULT_TEST_DIR = os.path.join(CURRENT_DIR, "test")
DEFAULT_PERSON_PATH = os.path.join(DEFAULT_TEST_DIR, "person.jpg")
DEFAULT_GARMENT_PATH = os.path.join(DEFAULT_TEST_DIR, "garment.jpg")
DEFAULT_OUTPUT_PATH = os.path.join(DEFAULT_TEST_DIR, "tryon_result.jpg")

# Input model
class TryOnRequest(BaseModel):
    person_path: str = DEFAULT_PERSON_PATH
    garment_path: str = DEFAULT_GARMENT_PATH
    output_path: str = DEFAULT_OUTPUT_PATH


def generate_tryon(api_key: str, person_path: str, garment_path: str, fast_mode: bool = True) -> dict:
    headers = {'Authorization': f'Bearer {api_key}'}
    data = {'fast_mode': 'true'} if fast_mode else {}

    with open(person_path, 'rb') as pfile, open(garment_path, 'rb') as gfile:
        files = {
            'person_images': ('person.jpg', pfile, 'image/jpeg'),
            'garment_images': ('garment.jpg', gfile, 'image/jpeg')
        }

        response = requests.post(
            'https://tryon-api.com/api/v1/tryon',
            headers=headers,
            files=files,
            data=data
        )

    if response.status_code == 400:
        raise HTTPException(status_code=400, detail=f"Bad Request: {response.text}")

    response.raise_for_status()
    job = response.json()
    status_url = job['statusUrl']

    while True:
        time.sleep(2)
        status_resp = requests.get(f"https://tryon-api.com{status_url}", headers=headers)
        status_resp.raise_for_status()
        payload = status_resp.json()
        status = payload.get("status")

        if status == "completed":
            return {
                "imageUrl": payload.get("imageUrl"),
                "imageBase64": payload.get("imageBase64")
            }
        elif status == "failed":
            raise HTTPException(
                status_code=500,
                detail=f"Tryon job failed: {payload.get('error')} ({payload.get('errorCode')})"
            )


def save_image(result: dict, output_path: str):
    if result.get("imageUrl"):
        image_data = requests.get(result["imageUrl"]).content
    elif result.get("imageBase64"):
        image_data = base64.b64decode(result["imageBase64"])
    else:
        raise ValueError("No image data in result.")

    with open(output_path, "wb") as f:
        f.write(image_data)


@app.post("/generate-tryon")
def tryon_generate(request: TryOnRequest):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API_KEY not set in environment.")

    if not os.path.exists(request.person_path) or not os.path.exists(request.garment_path):
        raise HTTPException(status_code=404, detail="Person or Garment image not found.")

    result = generate_tryon(API_KEY, request.person_path, request.garment_path, fast_mode=True)
    save_image(result, request.output_path)

    return FileResponse(path=request.output_path, filename="tryon_result.jpg", media_type="image/jpeg")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run TryOn via CLI.")
    parser.add_argument("--person_path", type=str, required=True)
    parser.add_argument("--garment_path", type=str, required=True)
    parser.add_argument("--output_path", type=str, required=True)
    args = parser.parse_args()

    if not API_KEY:
        raise RuntimeError("API_KEY not set in environment.")
    if not os.path.exists(args.person_path) or not os.path.exists(args.garment_path):
        raise RuntimeError("Person or Garment image not found.")
    result = generate_tryon(API_KEY, args.person_path, args.garment_path, fast_mode=True)
    save_image(result, args.output_path)
    print(f"Saved tryon result to {args.output_path}")

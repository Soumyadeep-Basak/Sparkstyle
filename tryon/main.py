from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
import requests, os, time, shutil
from dotenv import load_dotenv
from uuid import uuid4

# Load API keys
load_dotenv()
glam_api_key = os.getenv("GLAM_API_KEY")
imgbb_api_key = os.getenv("IMGBB_API_KEY")

app = FastAPI()

# Upload to imgbb
def upload_to_imgbb(file_path: str):
    print(f"⬆️ Uploading {file_path} to imgbb...")
    with open(file_path, "rb") as f:
        url = "https://api.imgbb.com/1/upload"
        payload = {"key": imgbb_api_key}
        files = {"image": f}
        r = requests.post(url, data=payload, files=files)
        if r.status_code == 200:
            image_url = r.json()["data"]["url"]
            print(f"✅ Uploaded to: {image_url}")
            return image_url
        else:
            print("❌ Upload failed:", r.text)
            return None

@app.post("/virtual-tryon/")
async def virtual_tryon(
    media: UploadFile = File(...),
    garment: UploadFile = File(...),
    mask_type: str = Form("overall")
):
    if not glam_api_key or not imgbb_api_key:
        raise HTTPException(status_code=500, detail="Missing API keys.")

    # Save temp files
    media_path = f"temp_{uuid4().hex}_{media.filename}"
    garment_path = f"temp_{uuid4().hex}_{garment.filename}"

    with open(media_path, "wb") as f:
        shutil.copyfileobj(media.file, f)
    with open(garment_path, "wb") as f:
        shutil.copyfileobj(garment.file, f)

    try:
        media_url = upload_to_imgbb(media_path)
        garment_url = upload_to_imgbb(garment_path)

        if not media_url or not garment_url:
            raise HTTPException(status_code=400, detail="Image upload to imgbb failed.")

        # Send to Glam API
        payload = {
            "mask_type": mask_type,
            "media_url": media_url,
            "garment_url": garment_url
        }
        headers = {
            "X-API-Key": glam_api_key,
            "accept": "application/json",
            "content-type": "application/json"
        }

        print("🚀 Sending to GLAM API...")
        response = requests.post("https://api.glam.ai/api/v1/tryon", json=payload, headers=headers)

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        event_id = response.json().get("event_id")
        if not event_id:
            raise HTTPException(status_code=500, detail="No event_id in response.")

        print(f"🎯 Event ID: {event_id}")
        status_url = f"https://api.glam.ai/api/v1/tryon/{event_id}"

        # Polling loop
        while True:
            time.sleep(2)
            res = requests.get(status_url, headers={"X-API-Key": glam_api_key}).json()
            if res.get("status") == "READY":
                output_url = res["media_urls"][0]
                break
            elif res.get("status") == "FAILED":
                raise HTTPException(status_code=500, detail="Try-on generation failed.")
            else:
                print(f"⌛ Waiting... Status: {res.get('status')}")

        # Download result
        output_path = f"tryon_{uuid4().hex}.jpg"
        img_data = requests.get(output_url)
        with open(output_path, "wb") as f:
            f.write(img_data.content)

        return FileResponse(output_path, media_type="image/jpeg", filename="tryon.jpg")

    finally:
        # Cleanup temp
        for path in [media_path, garment_path]:
            if os.path.exists(path):
                os.remove(path)

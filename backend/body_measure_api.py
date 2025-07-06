
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.body_measure import router as body_measure_router

app = FastAPI(title="Body Measurement API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(body_measure_router, tags=["body-measure"])

@app.get("/")
async def root():
    return {"message": "Body Measurement API - Ready for processing!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "body-measurement-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

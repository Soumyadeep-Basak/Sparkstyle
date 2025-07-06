from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.main import api_router

app = FastAPI(title="Sparkathon API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to the Sparkathon FastAPI API!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "sparkathon-api"}

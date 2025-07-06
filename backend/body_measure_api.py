
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.views.body_measure_views import router as body_measure_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(body_measure_router)

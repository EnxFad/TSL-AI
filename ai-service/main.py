import os

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from predictor import BoxLockPredictor

AI_MOCK = os.getenv("AI_MOCK", "true").lower() == "true"
MODEL_PATH = os.getenv("MODEL_PATH", "models/box_lock_model.pt")

app = FastAPI(title="Box Inspection AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = BoxLockPredictor(model_path=MODEL_PATH, mock=AI_MOCK)


@app.get("/health")
async def health():
    return {"status": "ok", "mock": AI_MOCK}


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    image_bytes = await image.read()
    result = predictor.predict(image_bytes)
    return {"result": result}

import hmac
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, status

from classifier import classifier

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")


def require_token(request: Request) -> None:
    expected = os.getenv("ML_API_TOKEN", "")
    insecure = os.getenv("ML_INSECURE_DEV_MODE", "false").lower() == "true"
    if insecure:
        return
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ML_API_TOKEN is not configured",
        )
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not hmac.compare_digest(token, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid ML API token",
        )


app = FastAPI(title="MausamNet-AI ML Service", version="0.1.0")


@app.get("/api/health", dependencies=[Depends(require_token)])
def health():
    return {
        "status": "UP",
        "service": "mausamnet-ml",
        "model_loaded": classifier.using_model,
        "now": datetime.now(timezone.utc).isoformat() + "Z",
    }


@app.post("/api/classify", dependencies=[Depends(require_token)])
def classify(payload: dict):
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="text is required")
    result = classifier.classify(text)
    return result


@app.post("/api/predict", dependencies=[Depends(require_token)])
def predict(payload: dict):
    return classify(payload)


@app.get("/api/train/status", dependencies=[Depends(require_token)])
def train_status():
    return {
        "model_loaded": classifier.using_model,
        "model_path": str(classifier.__class__.__module__),
    }
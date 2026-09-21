import hmac
import os
import sys
import warnings
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, status
from pydantic import BaseModel, Field

from classifier import MODEL_PATH, classifier

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")

INSECURE_DEV_MODE = os.getenv("ML_INSECURE_DEV_MODE", "false").lower() == "true"
NODE_ENV = os.getenv("NODE_ENV", "").lower()

if INSECURE_DEV_MODE:
    if NODE_ENV == "production":
        sys.stderr.write(
            "ML_INSECURE_DEV_MODE=true is not allowed with NODE_ENV=production. "
            "Refusing to start.\n"
        )
        sys.exit(1)
    warnings.warn(
        "ML_INSECURE_DEV_MODE=true: request authentication is DISABLED. "
        "Intended for local development only.",
        stacklevel=2,
    )

MAX_BODY_BYTES = 128 * 1024
MAX_TEXT_LENGTH = 10_000


class ClassifyRequest(BaseModel):
    text: str = Field(max_length=MAX_TEXT_LENGTH)


def require_token(request: Request) -> None:
    if INSECURE_DEV_MODE:
        return
    expected = os.getenv("ML_API_TOKEN", "")
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


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit():
        if int(content_length) > MAX_BODY_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Request body exceeds {MAX_BODY_BYTES} bytes",
            )
    return await call_next(request)


@app.get("/api/health", dependencies=[Depends(require_token)])
def health():
    return {
        "status": "UP",
        "service": "mausamnet-ml",
        "model_loaded": classifier.using_model,
        "now": datetime.now(timezone.utc).isoformat() + "Z",
    }


@app.post("/api/classify", dependencies=[Depends(require_token)])
def classify(payload: ClassifyRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="text is required")
    return classifier.classify(text)


@app.post("/api/predict", dependencies=[Depends(require_token)])
def predict(payload: ClassifyRequest):
    text = payload.text.strip()
    return classifier.classify(text)


@app.get("/api/train/status", dependencies=[Depends(require_token)])
def train_status():
    return {
        "model_loaded": classifier.using_model,
        "model_path": str(MODEL_PATH) if classifier.using_model else None,
    }
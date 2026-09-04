from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.classify import classify

router = APIRouter(prefix="/classify", tags=["classify"])


class TextInput(BaseModel):
    text: str


class ClassificationResponse(BaseModel):
    event_type: str
    confidence: float
    probabilities: dict[str, float]


@router.post("/", response_model=ClassificationResponse)
async def classify_weather_event(input: TextInput) -> dict[str, Any]:
    """Classify a weather report description into an event type."""
    return classify(input.text)

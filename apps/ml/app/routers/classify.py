from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/classify", tags=["classify"])


class TextInput(BaseModel):
    text: str


class ClassificationResponse(BaseModel):
    event_type: str
    confidence: float


@router.post("/", response_model=ClassificationResponse)
async def classify_weather_event(input: TextInput):
    """Classify a weather report into an event type (placeholder)."""
    return ClassificationResponse(event_type="other", confidence=0.0)

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.credibility import score_credibility

router = APIRouter(prefix="/credibility", tags=["credibility"])


class CredibilityInput(BaseModel):
    text: str
    source: str
    has_media: bool = False
    has_location: bool = True


class CredibilityResponse(BaseModel):
    score: float
    factors: dict[str, float]


@router.post("/", response_model=CredibilityResponse)
async def score_credibility_endpoint(input: CredibilityInput) -> dict[str, Any]:
    """Score the credibility of a weather report."""
    return score_credibility(
        text=input.text,
        source=input.source,
        has_media=input.has_media,
        has_location=input.has_location,
    )
